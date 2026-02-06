<?php

defined('ABSPATH') || exit;

function qchf_register_rest_routes() {
  register_rest_route('qc/v1', '/login', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_login',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('qc/v1', '/me', [
    'methods' => 'GET',
    'callback' => 'qchf_rest_me',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/feedback', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_create_feedback',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/feedback', [
    'methods' => 'GET',
    'callback' => 'qchf_rest_list_feedback',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/versions', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_create_version',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/versions', [
    'methods' => 'GET',
    'callback' => 'qchf_rest_list_versions',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/feedback/(?P<id>\d+)', [
    'methods' => 'DELETE',
    'callback' => 'qchf_rest_delete_feedback',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/feedback/(?P<id>\d+)/resolve', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_resolve_feedback',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/feedback/(?P<id>\d+)/unresolve', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_unresolve_feedback',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/bugs', [
    'methods' => 'POST',
    'callback' => 'qchf_rest_create_bug',
    'permission_callback' => 'qchf_require_auth',
  ]);

  register_rest_route('qc/v1', '/bugs', [
    'methods' => 'GET',
    'callback' => 'qchf_rest_list_bugs',
    'permission_callback' => 'qchf_require_auth',
  ]);
}

function qchf_rest_unresolve_feedback(WP_REST_Request $request) {
  $id = (int) $request->get_param('id');
  if (!$id) return new WP_Error('qchf_bad_request', 'Invalid ID', ['status' => 400]);

  $post = get_post($id);
  if (!$post || $post->post_type !== 'qc_feedback') {
    return new WP_Error('qchf_not_found', 'Feedback not found', ['status' => 404]);
  }

  delete_post_meta($id, 'qchf_resolved_by');
  delete_post_meta($id, 'qchf_resolved_at');

  return [
    'success' => true
  ];
}

function qchf_rest_delete_feedback(WP_REST_Request $request) {
  $id = (int) $request->get_param('id');
  if (!$id) return new WP_Error('qchf_bad_request', 'Invalid ID', ['status' => 400]);

  $post = get_post($id);
  if (!$post || $post->post_type !== 'qc_feedback') {
    return new WP_Error('qchf_not_found', 'Feedback not found', ['status' => 404]);
  }

  $result = wp_delete_post($id, true);
  if (!$result) return new WP_Error('qchf_error', 'Delete failed', ['status' => 500]);

  return ['success' => true];
}

function qchf_rest_resolve_feedback(WP_REST_Request $request) {
  $id = (int) $request->get_param('id');
  if (!$id) return new WP_Error('qchf_bad_request', 'Invalid ID', ['status' => 400]);

  $post = get_post($id);
  if (!$post || $post->post_type !== 'qc_feedback') {
    return new WP_Error('qchf_not_found', 'Feedback not found', ['status' => 404]);
  }

  $user = wp_get_current_user();
  update_post_meta($id, 'qchf_resolved_by', $user->display_name ?: $user->user_login);
  update_post_meta($id, 'qchf_resolved_at', current_time('c'));

  return [
    'success' => true,
    'resolvedBy' => get_post_meta($id, 'qchf_resolved_by', true),
    'resolvedAt' => get_post_meta($id, 'qchf_resolved_at', true),
  ];
}

function qchf_rest_login(WP_REST_Request $request) {
  $username = (string) ($request->get_param('username') ?? '');
  $password = (string) ($request->get_param('password') ?? '');

  if ($username === '' || $password === '') {
    return new WP_Error('qchf_bad_request', 'Missing username or password', ['status' => 400]);
  }

  $user = wp_authenticate($username, $password);
  if (is_wp_error($user)) {
    return new WP_Error('qchf_invalid_credentials', 'Invalid credentials', ['status' => 401]);
  }

  $token = qchf_issue_user_token($user->ID);

  return [
    'token' => $token,
    'user' => [
      'id' => $user->ID,
      'username' => $user->user_login,
      'email' => $user->user_email,
      'displayName' => $user->display_name,
    ],
  ];
}

function qchf_rest_me(WP_REST_Request $request) {
  $user = wp_get_current_user();
  return [
    'id' => $user->ID,
    'username' => $user->user_login,
    'email' => $user->user_email,
    'displayName' => $user->display_name,
  ];
}

function qchf_rest_create_feedback(WP_REST_Request $request) {
  // Get user directly from token - don't rely on wp_get_current_user()
  $token = qchf_get_bearer_token_from_request($request);
  $user = qchf_get_user_from_token($token);

  if (!$user || !$user->ID) {
    return new WP_Error('qchf_unauthorized', 'User not found from token', ['status' => 401]);
  }

  $url = (string) ($request->get_param('url') ?? '');
  $page_title = (string) ($request->get_param('pageTitle') ?? '');
  $notes = (string) ($request->get_param('notes') ?? '');
  $tool = (string) ($request->get_param('tool') ?? '');
  $raw = $request->get_param('raw');
  $image_data = (string) ($request->get_param('image') ?? ''); // Base64 image data (cropped area or full)

  // Marker data
  $marker_x = $request->get_param('markerX');
  $marker_y = $request->get_param('markerY');
  $marker_num = $request->get_param('markerNum');
  $marker_color = $request->get_param('markerColor');
  $marker_selector = $request->get_param('markerSelector');
  $marker_offset_x = $request->get_param('markerOffsetX');
  $marker_offset_y = $request->get_param('markerOffsetY');
  $marker_window_w = $request->get_param('markerWindowW');
  $marker_window_h = $request->get_param('markerWindowH');
  $marker_doc_w = $request->get_param('markerDocW');
  $marker_doc_h = $request->get_param('markerDocH');
  $marker_text_context = $request->get_param('textContext');
  $marker_aria_label = $request->get_param('ariaLabel');

  if ($url === '') {
    return new WP_Error('qchf_bad_request', 'Missing url', ['status' => 400]);
  }

  $post_id = wp_insert_post([
    'post_type' => 'qc_feedback',
    'post_status' => 'publish',
    'post_title' => $page_title !== '' ? $page_title : $url,
    'post_content' => $notes,
    'post_author' => $user->ID,
  ], true);

  if (is_wp_error($post_id)) {
    return $post_id;
  }

  update_post_meta($post_id, 'qchf_url', $url);
  update_post_meta($post_id, 'qchf_author_name', !empty($user->display_name) ? $user->display_name : $user->user_login);
  update_post_meta($post_id, 'qchf_page_title', $page_title);
  update_post_meta($post_id, 'qchf_tool', $tool);

  if ($marker_x !== null) update_post_meta($post_id, 'qchf_marker_x', $marker_x);
  if ($marker_y !== null) update_post_meta($post_id, 'qchf_marker_y', $marker_y);
  if ($marker_num !== null) update_post_meta($post_id, 'qchf_marker_num', $marker_num);
  if ($marker_color !== null) update_post_meta($post_id, 'qchf_marker_color', $marker_color);
  if ($marker_selector !== null) update_post_meta($post_id, 'qchf_marker_selector', $marker_selector);
  if ($marker_offset_x !== null) update_post_meta($post_id, 'qchf_marker_offset_x', $marker_offset_x);
  if ($marker_offset_y !== null) update_post_meta($post_id, 'qchf_marker_offset_y', $marker_offset_y);
  if ($marker_window_w !== null) update_post_meta($post_id, 'qchf_marker_window_w', $marker_window_w);
  if ($marker_window_h !== null) update_post_meta($post_id, 'qchf_marker_window_h', $marker_window_h);
  if ($marker_doc_w !== null) update_post_meta($post_id, 'qchf_marker_doc_w', $marker_doc_w);
  if ($marker_doc_h !== null) update_post_meta($post_id, 'qchf_marker_doc_h', $marker_doc_h);
  if ($marker_text_context !== null) update_post_meta($post_id, 'qchf_marker_text_context', $marker_text_context);
  if ($marker_aria_label !== null) update_post_meta($post_id, 'qchf_marker_aria_label', $marker_aria_label);

  if ($raw !== null) {
    update_post_meta($post_id, 'qchf_raw', wp_json_encode($raw));
  }

  // Handle image upload from base64 (for area-note or other feedback images)
  if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $image_data, $matches)) {
    $image_type = $matches[1];
    $image_base64 = $matches[2];
    $image_binary = base64_decode($image_base64);

    $filename = 'feedback-' . time() . '.' . $image_type;
    $upload = wp_upload_bits($filename, null, $image_binary);

    if (!$upload['error']) {
      $file_path = $upload['file'];
      $file_type = wp_check_filetype($filename, null);

      $attachment = [
        'post_mime_type' => $file_type['type'],
        'post_title' => $filename,
        'post_content' => '',
        'post_status' => 'inherit',
      ];

      $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
      require_once(ABSPATH . 'wp-admin/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
      wp_update_attachment_metadata($attach_id, $attach_data);
      set_post_thumbnail($post_id, $attach_id);
    }
  }

  // Handle file attachment upload (max 5MB)
  $attachment_data = $request->get_param('attachment');
  $attachment_url = '';
  $attachment_name = '';
  if ($attachment_data && is_array($attachment_data)) {
    $att_name = sanitize_file_name($attachment_data['name'] ?? 'attachment');
    $att_type = $attachment_data['type'] ?? '';
    $att_data_url = $attachment_data['data'] ?? '';

    if (preg_match('/^data:([^;]+);base64,(.+)$/', $att_data_url, $att_matches)) {
      $att_mime = $att_matches[1];
      $att_base64 = $att_matches[2];
      $att_binary = base64_decode($att_base64);

      // Enforce 5MB limit
      if (strlen($att_binary) <= 5 * 1024 * 1024) {
        $att_upload = wp_upload_bits($att_name, null, $att_binary);

        if (!$att_upload['error']) {
          $att_file_path = $att_upload['file'];
          $att_file_type = wp_check_filetype($att_name, null);

          $att_post = [
            'post_mime_type' => $att_file_type['type'] ?: $att_mime,
            'post_title' => pathinfo($att_name, PATHINFO_FILENAME),
            'post_content' => '',
            'post_status' => 'inherit',
          ];

          $att_id = wp_insert_attachment($att_post, $att_file_path, $post_id);
          require_once(ABSPATH . 'wp-admin/includes/image.php');
          $att_metadata = wp_generate_attachment_metadata($att_id, $att_file_path);
          wp_update_attachment_metadata($att_id, $att_metadata);

          update_post_meta($post_id, 'qchf_attachment_id', $att_id);
          $attachment_url = wp_get_attachment_url($att_id);
          $attachment_name = $att_name;
        }
      }
    }
  }

  // Return full item for instant UI update
  $post = get_post($post_id);
  $author_id = (int) $post->post_author;
  $author = $author_id > 0 ? get_userdata($author_id) : null;
  $author_name = $author ? (!empty($author->display_name) ? $author->display_name : $author->user_login) : 'Unknown';
  
  // Fallback to meta if needed
  if (empty($author_name) || $author_name === 'Unknown') {
    $author_name = (string) get_post_meta($post_id, 'qchf_author_name', true) ?: 'Unknown';
  }

  return [
    'id' => $post_id,
    'url' => (string) get_post_meta($post_id, 'qchf_url', true),
    'pageTitle' => (string) get_post_meta($post_id, 'qchf_page_title', true),
    'tool' => (string) get_post_meta($post_id, 'qchf_tool', true),
    'notes' => $post->post_content,
    'imageUrl' => get_the_post_thumbnail_url($post_id, 'full'),
    'authorId' => $author_id,
    'authorName' => $author_name,
    'createdAt' => get_post_time('c', true, $post_id),
    'markerX' => get_post_meta($post_id, 'qchf_marker_x', true),
    'markerY' => get_post_meta($post_id, 'qchf_marker_y', true),
    'markerNum' => get_post_meta($post_id, 'qchf_marker_num', true),
    'markerColor' => get_post_meta($post_id, 'qchf_marker_color', true),
    'attachmentUrl' => $attachment_url ?: '',
    'attachmentName' => $attachment_name ?: '',
    'raw' => $raw,
  ];
}

function qchf_rest_list_feedback(WP_REST_Request $request) {
  $url = (string) ($request->get_param('url') ?? '');
  $limit = (int) ($request->get_param('limit') ?? 20);
  $limit = max(1, min(100, $limit));

  $args = [
    'post_type' => 'qc_feedback',
    'post_status' => 'publish',
    'posts_per_page' => $limit,
    'orderby' => 'date',
    'order' => 'DESC',
  ];

  if ($url !== '') {
    $args['meta_query'] = [[
      'key' => 'qchf_url',
      'value' => $url,
      'compare' => '=',
    ]];
  }

  $q = new WP_Query($args);
  $items = [];

  foreach ($q->posts as $post) {
    $author_id = (int) $post->post_author;
    $author = $author_id > 0 ? get_userdata($author_id) : null;
    $author_name = '';

    if ($author) {
      $author_name = !empty($author->display_name) ? $author->display_name : $author->user_login;
    }

    // Fallback to metadata
    if (empty($author_name)) {
      $author_name = (string) get_post_meta($post->ID, 'qchf_author_name', true);
    }

    if (empty($author_name)) {
      $author_name = 'Unknown';
    }

    // Get attachment info
    $att_id = get_post_meta($post->ID, 'qchf_attachment_id', true);
    $att_url = $att_id ? wp_get_attachment_url($att_id) : '';
    $att_name = '';
    if ($att_id) {
      $att_post = get_post($att_id);
      if ($att_post) {
        $att_name = basename(get_attached_file($att_id) ?: $att_post->post_title);
      }
    }

    $items[] = [
      'id' => $post->ID,
      'url' => (string) get_post_meta($post->ID, 'qchf_url', true),
      'pageTitle' => (string) get_post_meta($post->ID, 'qchf_page_title', true),
      'tool' => (string) get_post_meta($post->ID, 'qchf_tool', true),
      'notes' => $post->post_content,
      'imageUrl' => get_the_post_thumbnail_url($post->ID, 'full'),
      'authorId' => $author_id,
      'authorName' => $author_name,
      'createdAt' => get_post_time('c', true, $post->ID),
      'markerX' => get_post_meta($post->ID, 'qchf_marker_x', true),
      'markerY' => get_post_meta($post->ID, 'qchf_marker_y', true),
      'markerNum' => get_post_meta($post->ID, 'qchf_marker_num', true),
      'markerColor' => get_post_meta($post->ID, 'qchf_marker_color', true),
      'markerSelector' => get_post_meta($post->ID, 'qchf_marker_selector', true),
      'markerOffsetX' => get_post_meta($post->ID, 'qchf_marker_offset_x', true),
      'markerOffsetY' => get_post_meta($post->ID, 'qchf_marker_offset_y', true),
      'markerWindowW' => get_post_meta($post->ID, 'qchf_marker_window_w', true),
      'markerWindowH' => get_post_meta($post->ID, 'qchf_marker_window_h', true),
      'markerDocW' => get_post_meta($post->ID, 'qchf_marker_doc_w', true),
      'markerDocH' => get_post_meta($post->ID, 'qchf_marker_doc_h', true),
      'textContext' => get_post_meta($post->ID, 'qchf_marker_text_context', true),
      'ariaLabel' => get_post_meta($post->ID, 'qchf_marker_aria_label', true),
      'resolvedBy' => get_post_meta($post->ID, 'qchf_resolved_by', true),
      'resolvedAt' => get_post_meta($post->ID, 'qchf_resolved_at', true),
      'attachmentUrl' => $att_url ?: '',
      'attachmentName' => $att_name ?: '',
      'raw' => json_decode(get_post_meta($post->ID, 'qchf_raw', true), true),
    ];
  }

  return [
    'items' => $items,
  ];
}

function qchf_rest_create_version(WP_REST_Request $request) {
  // Get user directly from token - don't rely on wp_get_current_user()
  $token = qchf_get_bearer_token_from_request($request);
  $user = qchf_get_user_from_token($token);

  if (!$user || !$user->ID) {
    return new WP_Error('qchf_unauthorized', 'User not found from token', ['status' => 401]);
  }

  $url = (string) ($request->get_param('url') ?? '');
  $page_title = (string) ($request->get_param('pageTitle') ?? '');
  $notes = (string) ($request->get_param('notes') ?? '');
  $image_data = (string) ($request->get_param('image') ?? ''); // Base64 image data

  if ($url === '' || $image_data === '') {
    return new WP_Error('qchf_bad_request', 'Missing url or image', ['status' => 400]);
  }

  // Create the version post
  $post_id = wp_insert_post([
    'post_type' => 'qc_version',
    'post_status' => 'publish',
    'post_title' => ($page_title !== '' ? $page_title : $url) . ' - ' . current_time('mysql'),
    'post_content' => $notes,
    'post_author' => $user->ID,
  ], true);

  if (is_wp_error($post_id)) {
    return $post_id;
  }

  update_post_meta($post_id, 'qchf_url', $url);
  update_post_meta($post_id, 'qchf_author_name', !empty($user->display_name) ? $user->display_name : $user->user_login);

  // Handle image upload from base64
  if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $image_data, $matches)) {
    $image_type = $matches[1];
    $image_base64 = $matches[2];
    $image_binary = base64_decode($image_base64);

    $filename = 'screenshot-' . time() . '.' . $image_type;
    $upload = wp_upload_bits($filename, null, $image_binary);

    if (!$upload['error']) {
      $file_path = $upload['file'];
      $file_type = wp_check_filetype($filename, null);

      $attachment = [
        'post_mime_type' => $file_type['type'],
        'post_title' => $filename,
        'post_content' => '',
        'post_status' => 'inherit',
      ];

      $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
      require_once(ABSPATH . 'wp-admin/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
      wp_update_attachment_metadata($attach_id, $attach_data);
      set_post_thumbnail($post_id, $attach_id);
    }
  }

  // Return full item for instant UI update
  $author_name = !empty($user->display_name) ? $user->display_name : $user->user_login;
  
  return [
    'id' => $post_id,
    'url' => $url,
    'pageTitle' => $page_title,
    'notes' => $notes,
    'authorName' => $author_name,
    'createdAt' => get_post_time('c', true, $post_id),
    'imageUrl' => get_the_post_thumbnail_url($post_id, 'full'),
  ];
}

function qchf_rest_list_versions(WP_REST_Request $request) {
  $url = (string) ($request->get_param('url') ?? '');
  $limit = (int) ($request->get_param('limit') ?? 20);
  $limit = max(1, min(100, $limit));

  $args = [
    'post_type' => 'qc_version',
    'post_status' => 'publish',
    'posts_per_page' => $limit,
    'orderby' => 'date',
    'order' => 'DESC',
  ];

  if ($url !== '') {
    $args['meta_query'] = [[
      'key' => 'qchf_url',
      'value' => $url,
      'compare' => '=',
    ]];
  }

  $q = new WP_Query($args);
  $items = [];

  foreach ($q->posts as $post) {
    $author_id = (int) $post->post_author;
    $author = $author_id > 0 ? get_userdata($author_id) : null;
    $author_name = '';
    
    if ($author) {
      $author_name = !empty($author->display_name) ? $author->display_name : $author->user_login;
    }
    
    // Fallback to metadata if userdata retrieval failed or user was deleted
    if (empty($author_name)) {
      $author_name = (string) get_post_meta($post->ID, 'qchf_author_name', true);
    }
    
    if (empty($author_name)) {
      $author_name = 'Unknown';
    }
    
    $items[] = [
      'id' => $post->ID,
      'url' => (string) get_post_meta($post->ID, 'qchf_url', true),
      'title' => $post->post_title,
      'notes' => $post->post_content,
      'imageUrl' => get_the_post_thumbnail_url($post->ID, 'full'),
      'authorId' => $author_id,
      'authorName' => $author_name,
      'createdAt' => get_post_time('c', true, $post->ID),
    ];
  }

  return [
    'items' => $items,
  ];
}

function qchf_rest_create_bug(WP_REST_Request $request) {
  $token = qchf_get_bearer_token_from_request($request);
  $user = qchf_get_user_from_token($token);

  if (!$user || !$user->ID) {
    return new WP_Error('qchf_unauthorized', 'User not found from token', ['status' => 401]);
  }

  $message = (string) ($request->get_param('message') ?? '');
  $url = (string) ($request->get_param('url') ?? '');
  $page_title = (string) ($request->get_param('pageTitle') ?? '');
  $submitter_name = (string) ($request->get_param('submitterName') ?? '');

  if ($message === '') {
    return new WP_Error('qchf_bad_request', 'Missing message', ['status' => 400]);
  }

  $author_name = $submitter_name !== '' ? $submitter_name : (!empty($user->display_name) ? $user->display_name : $user->user_login);

  $post_id = wp_insert_post([
    'post_type' => 'qc_bug',
    'post_status' => 'publish',
    'post_title' => $page_title !== '' ? $page_title : $url,
    'post_content' => $message,
    'post_author' => $user->ID,
  ], true);

  if (is_wp_error($post_id)) {
    return $post_id;
  }

  update_post_meta($post_id, 'qchf_url', $url);
  update_post_meta($post_id, 'qchf_bug_submitter', $author_name);
  update_post_meta($post_id, 'qchf_page_title', $page_title);

  // Handle screenshot image upload from base64
  $image_data = (string) ($request->get_param('image') ?? '');
  $screenshot_url = '';
  if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $image_data, $matches)) {
    $image_type = $matches[1];
    $image_base64 = $matches[2];
    $image_binary = base64_decode($image_base64);

    $filename = 'bug-screenshot-' . time() . '.' . $image_type;
    $upload = wp_upload_bits($filename, null, $image_binary);

    if (!$upload['error']) {
      $file_path = $upload['file'];
      $file_type = wp_check_filetype($filename, null);

      $attachment = [
        'post_mime_type' => $file_type['type'],
        'post_title' => $filename,
        'post_content' => '',
        'post_status' => 'inherit',
      ];

      $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
      require_once(ABSPATH . 'wp-admin/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
      wp_update_attachment_metadata($attach_id, $attach_data);
      set_post_thumbnail($post_id, $attach_id);
      $screenshot_url = wp_get_attachment_url($attach_id);
    }
  }

  return [
    'id' => $post_id,
    'url' => $url,
    'pageTitle' => $page_title,
    'message' => $message,
    'submitterName' => $author_name,
    'screenshotUrl' => $screenshot_url,
    'createdAt' => get_post_time('c', true, $post_id),
  ];
}

function qchf_rest_list_bugs(WP_REST_Request $request) {
  $url = (string) ($request->get_param('url') ?? '');
  $limit = (int) ($request->get_param('limit') ?? 20);
  $limit = max(1, min(100, $limit));

  $args = [
    'post_type' => 'qc_bug',
    'post_status' => 'publish',
    'posts_per_page' => $limit,
    'orderby' => 'date',
    'order' => 'DESC',
  ];

  if ($url !== '') {
    $args['meta_query'] = [
      [
        'key' => 'qchf_url',
        'value' => $url,
        'compare' => '=',
      ],
    ];
  }

  $query = new WP_Query($args);
  $items = [];

  foreach ($query->posts as $post) {
    $submitter = get_post_meta($post->ID, 'qchf_bug_submitter', true);
    if (empty($submitter)) {
      $author_id = (int) $post->post_author;
      $author = $author_id > 0 ? get_userdata($author_id) : null;
      $submitter = $author ? (!empty($author->display_name) ? $author->display_name : $author->user_login) : 'Unknown';
    }

    $screenshot_url = get_the_post_thumbnail_url($post->ID, 'large');

    $items[] = [
      'id' => $post->ID,
      'url' => (string) get_post_meta($post->ID, 'qchf_url', true),
      'pageTitle' => (string) get_post_meta($post->ID, 'qchf_page_title', true),
      'message' => $post->post_content,
      'submitterName' => $submitter,
      'screenshotUrl' => $screenshot_url ? (string) $screenshot_url : '',
      'createdAt' => get_post_time('c', true, $post->ID),
    ];
  }

  return [
    'items' => $items,
  ];
}
