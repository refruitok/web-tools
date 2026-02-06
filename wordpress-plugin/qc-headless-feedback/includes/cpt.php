<?php

defined('ABSPATH') || exit;

function qchf_register_cpt() {
  add_action('init', function () {
    register_post_type('qc_feedback', [
      'labels' => [
        'name' => 'QC Feedback',
        'singular_name' => 'QC Feedback',
      ],
      'public' => false,
      'show_ui' => true,
      'show_in_menu' => false, // Hidden from main menu, shown under QC Extension
      'supports' => ['title', 'editor', 'author', 'thumbnail'],
      'capability_type' => 'post',
      'show_in_rest' => false,
    ]);

    register_post_type('qc_version', [
      'labels' => [
        'name' => 'QC Versions',
        'singular_name' => 'QC Version',
      ],
      'public' => false,
      'show_ui' => true,
      'show_in_menu' => false, // Hidden from main menu, shown under QC Extension
      'supports' => ['title', 'editor', 'author', 'thumbnail'],
      'capability_type' => 'post',
      'show_in_rest' => false,
    ]);

    register_post_type('qc_bug', [
      'labels' => [
        'name' => 'QC Bug Reports',
        'singular_name' => 'QC Bug Report',
      ],
      'public' => false,
      'show_ui' => true,
      'show_in_menu' => false, // Hidden from main menu, shown under QC Extension
      'supports' => ['title', 'editor', 'author'],
      'capability_type' => 'post',
      'show_in_rest' => false,
    ]);
  });

  // Automatically delete the associated screenshot when a QC Version is deleted
  add_action('before_delete_post', function ($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'qc_version') {
      return;
    }

    $thumbnail_id = get_post_thumbnail_id($post_id);
    if ($thumbnail_id) {
      // Delete the attachment and the actual file
      wp_delete_attachment($thumbnail_id, true);
    }
  });
}
