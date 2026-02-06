<?php

defined('ABSPATH') || exit;

const QCHF_USER_META_TOKEN_HASH = 'qchf_extension_token_hash';
const QCHF_USER_META_TOKEN_CREATED_AT = 'qchf_extension_token_created_at';

function qchf_generate_token() {
  return wp_generate_password(48, false, false);
}

function qchf_hash_token($token) {
  return hash('sha256', $token . wp_salt('auth'));
}

function qchf_issue_user_token($user_id) {
  $token = qchf_generate_token();
  update_user_meta($user_id, QCHF_USER_META_TOKEN_HASH, qchf_hash_token($token));
  update_user_meta($user_id, QCHF_USER_META_TOKEN_CREATED_AT, time());
  return $token;
}

function qchf_revoke_user_token($user_id) {
  delete_user_meta($user_id, QCHF_USER_META_TOKEN_HASH);
  delete_user_meta($user_id, QCHF_USER_META_TOKEN_CREATED_AT);
}

function qchf_get_bearer_token_from_request(WP_REST_Request $request) {
  $auth = $request->get_header('authorization');
  if (!$auth) return null;

  if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m)) {
    return trim($m[1]);
  }
  return null;
}

function qchf_get_user_from_token($token) {
  if (!$token) return null;

  $hash = qchf_hash_token($token);
  $user_query = new WP_User_Query([
    'meta_key' => QCHF_USER_META_TOKEN_HASH,
    'meta_value' => $hash,
    'number' => 1,
    'fields' => 'ID'
  ]);

  $user_ids = $user_query->get_results();
  if (empty($user_ids)) return null;

  // Use get_userdata to get full WP_User object with all properties
  return get_userdata($user_ids[0]);
}

function qchf_require_auth(WP_REST_Request $request) {
  $token = qchf_get_bearer_token_from_request($request);
  $user = qchf_get_user_from_token($token);

  if (!$user) {
    return new WP_Error('qchf_unauthorized', 'Unauthorized', ['status' => 401]);
  }

  wp_set_current_user($user->ID);
  return true;
}
