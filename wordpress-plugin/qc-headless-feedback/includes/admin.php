<?php

defined('ABSPATH') || exit;

function qchf_register_admin_menu() {
  // Main QC menu
  add_menu_page(
    'QC Dashboard',
    'QC Extension',
    'manage_options',
    'qchf_dashboard',
    'qchf_render_dashboard_page',
    'dashicons-shield',
    80
  );
  
  // Dashboard submenu (same as parent)
  add_submenu_page(
    'qchf_dashboard',
    'QC Dashboard',
    'Dashboard',
    'manage_options',
    'qchf_dashboard',
    'qchf_render_dashboard_page'
  );
  
  // QC Feedback submenu
  add_submenu_page(
    'qchf_dashboard',
    'QC Feedback',
    'Feedback',
    'manage_options',
    'edit.php?post_type=qc_feedback'
  );
  
  // QC Versions submenu
  add_submenu_page(
    'qchf_dashboard',
    'QC Versions',
    'Versions',
    'manage_options',
    'edit.php?post_type=qc_version'
  );
  
  // QC Bug Reports submenu
  add_submenu_page(
    'qchf_dashboard',
    'QC Bug Reports',
    'Bug Reports',
    'manage_options',
    'edit.php?post_type=qc_bug'
  );
  
  // Settings submenu
  add_submenu_page(
    'qchf_dashboard',
    'QC Settings',
    'Settings',
    'manage_options',
    'qchf_settings',
    'qchf_render_settings_page'
  );
}

/**
 * QC Dashboard Page - Overview of all feedback and versions by page
 */
function qchf_render_dashboard_page() {
  if (!current_user_can('manage_options')) {
    wp_die('Unauthorized');
  }
  
  global $wpdb;
  
  // Get feedback stats grouped by URL
  $feedback_stats = $wpdb->get_results("
    SELECT 
      pm.meta_value as url,
      COUNT(p.ID) as total,
      SUM(CASE WHEN pm2.meta_value IS NULL THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN pm2.meta_value IS NOT NULL THEN 1 ELSE 0 END) as resolved_count,
      MAX(p.post_title) as page_title
    FROM {$wpdb->posts} p
    JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = 'qchf_url'
    LEFT JOIN {$wpdb->postmeta} pm2 ON p.ID = pm2.post_id AND pm2.meta_key = 'qchf_resolved_by'
    WHERE p.post_type = 'qc_feedback'
    AND p.post_status = 'publish'
    GROUP BY pm.meta_value
    ORDER BY open_count DESC, total DESC
  ");
  
  // Get version stats grouped by URL
  $version_stats = $wpdb->get_results("
    SELECT 
      pm.meta_value as url,
      COUNT(p.ID) as total,
      MAX(p.post_title) as page_title,
      MAX(p.post_date) as last_version
    FROM {$wpdb->posts} p
    JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = 'qchf_url'
    WHERE p.post_type = 'qc_version'
    AND p.post_status = 'publish'
    GROUP BY pm.meta_value
    ORDER BY last_version DESC
  ");
  
  // Overall stats
  $total_feedback = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'qc_feedback' AND post_status = 'publish'");
  $open_feedback = $wpdb->get_var("
    SELECT COUNT(*) FROM {$wpdb->posts} p
    LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = 'qchf_resolved_by'
    WHERE p.post_type = 'qc_feedback' AND p.post_status = 'publish' AND pm.meta_value IS NULL
  ");
  $total_versions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'qc_version' AND post_status = 'publish'");
  $total_bugs = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'qc_bug' AND post_status = 'publish'");
  $total_pages = count($feedback_stats) + count(array_filter($version_stats, function($v) use ($feedback_stats) {
    foreach ($feedback_stats as $f) {
      if ($f->url === $v->url) return false;
    }
    return true;
  }));
  
  ?>
  <div class="wrap">
    <h1>QC Dashboard</h1>
    
    <!-- Summary Cards -->
    <div style="display: flex; gap: 20px; margin: 20px 0;">
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #ff4757;"><?php echo esc_html($open_feedback); ?></div>
        <div style="color: #666; margin-top: 5px;">Open Feedback</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #2ed573;"><?php echo esc_html($total_feedback - $open_feedback); ?></div>
        <div style="color: #666; margin-top: 5px;">Resolved</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #3742fa;"><?php echo esc_html($total_versions); ?></div>
        <div style="color: #666; margin-top: 5px;">Versions</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #dc3545;"><?php echo esc_html($total_bugs); ?></div>
        <div style="color: #666; margin-top: 5px;">Bug Reports</div>
      </div>
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; text-align: center;">
        <div style="font-size: 36px; font-weight: bold; color: #747d8c;"><?php echo esc_html($total_pages); ?></div>
        <div style="color: #666; margin-top: 5px;">Pages Tracked</div>
      </div>
    </div>
    
    <!-- Feedback by Page -->
    <h2 style="margin-top: 30px;">Feedback by Page</h2>
    <?php if (empty($feedback_stats)): ?>
      <p style="color: #666;">No feedback recorded yet.</p>
    <?php else: ?>
      <table class="widefat striped" style="margin-top: 10px;">
        <thead>
          <tr>
            <th>Page</th>
            <th style="width: 100px; text-align: center;">Open</th>
            <th style="width: 100px; text-align: center;">Resolved</th>
            <th style="width: 100px; text-align: center;">Total</th>
            <th style="width: 200px;">Actions</th>
          </tr>
        </thead>
        <tbody id="qc-feedback-tbody">
          <?php foreach ($feedback_stats as $idx => $stat): 
            $display_title = preg_replace('/ - \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', '', $stat->page_title);
            $filter_url = admin_url('edit.php?post_type=qc_feedback&qc_url_filter=' . urlencode($stat->url));
            $recent_url = admin_url('edit.php?post_type=qc_feedback&qc_url_filter=' . urlencode($stat->url) . '&orderby=date&order=desc');
          ?>
          <tr class="qc-feedback-row" <?php if ($idx >= 10) echo 'style="display:none;"'; ?>>
            <td>
              <strong><?php echo esc_html($display_title ?: 'Untitled'); ?></strong><br>
              <a href="<?php echo esc_url($stat->url); ?>" target="_blank" style="font-size: 11px; color: #666;"><?php echo esc_html($stat->url); ?></a>
            </td>
            <td style="text-align: center;">
              <?php if ($stat->open_count > 0): ?>
                <span style="background: #ff4757; color: white; padding: 2px 10px; border-radius: 12px; font-weight: bold;"><?php echo esc_html($stat->open_count); ?></span>
              <?php else: ?>
                <span style="color: #ccc;">0</span>
              <?php endif; ?>
            </td>
            <td style="text-align: center;">
              <span style="color: #2ed573; font-weight: bold;"><?php echo esc_html($stat->resolved_count); ?></span>
            </td>
            <td style="text-align: center; font-weight: bold;"><?php echo esc_html($stat->total); ?></td>
            <td>
              <a href="<?php echo esc_url($filter_url); ?>" class="button button-small">View All</a>
              <a href="<?php echo esc_url($recent_url); ?>" class="button button-small" style="margin-left: 4px;">Recent Feedback</a>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php if (count($feedback_stats) > 10): ?>
        <div id="qc-feedback-pagination" style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
          <button class="button" id="qc-feedback-prev" disabled>&laquo; Prev</button>
          <span id="qc-feedback-page-info" style="font-size: 13px; color: #666;"></span>
          <button class="button" id="qc-feedback-next">&raquo; Next</button>
        </div>
      <?php endif; ?>
    <?php endif; ?>
    
    <!-- Versions by Page -->
    <h2 style="margin-top: 30px;">Versions by Page</h2>
    <?php if (empty($version_stats)): ?>
      <p style="color: #666;">No versions recorded yet.</p>
    <?php else: ?>
      <table class="widefat striped" style="margin-top: 10px;">
        <thead>
          <tr>
            <th>Page</th>
            <th style="width: 100px; text-align: center;">Versions</th>
            <th style="width: 180px;">Last Updated</th>
            <th style="width: 200px;">Actions</th>
          </tr>
        </thead>
        <tbody id="qc-version-tbody">
          <?php foreach ($version_stats as $idx => $stat): 
            $display_title = preg_replace('/ - \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', '', $stat->page_title);
            $filter_url = admin_url('edit.php?post_type=qc_version&qc_url_filter=' . urlencode($stat->url));
            $recent_url = admin_url('edit.php?post_type=qc_version&qc_url_filter=' . urlencode($stat->url) . '&orderby=date&order=desc');
          ?>
          <tr class="qc-version-row" <?php if ($idx >= 10) echo 'style="display:none;"'; ?>>
            <td>
              <strong><?php echo esc_html($display_title ?: 'Untitled'); ?></strong><br>
              <a href="<?php echo esc_url($stat->url); ?>" target="_blank" style="font-size: 11px; color: #666;"><?php echo esc_html($stat->url); ?></a>
            </td>
            <td style="text-align: center;">
              <span style="background: #3742fa; color: white; padding: 2px 10px; border-radius: 12px; font-weight: bold;"><?php echo esc_html($stat->total); ?></span>
            </td>
            <td style="color: #666;"><?php echo esc_html(date('M j, Y g:i a', strtotime($stat->last_version))); ?></td>
            <td>
              <a href="<?php echo esc_url($filter_url); ?>" class="button button-small">View All</a>
              <a href="<?php echo esc_url($recent_url); ?>" class="button button-small" style="margin-left: 4px;">Recent Version</a>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php if (count($version_stats) > 10): ?>
        <div id="qc-version-pagination" style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
          <button class="button" id="qc-version-prev" disabled>&laquo; Prev</button>
          <span id="qc-version-page-info" style="font-size: 13px; color: #666;"></span>
          <button class="button" id="qc-version-next">&raquo; Next</button>
        </div>
      <?php endif; ?>
    <?php endif; ?>
  </div>

  <script>
  (function() {
    function setupPagination(rowClass, prevId, nextId, infoId, perPage) {
      var rows = document.querySelectorAll('.' + rowClass);
      if (!rows.length) return;
      var totalPages = Math.ceil(rows.length / perPage);
      var currentPage = 1;
      var prevBtn = document.getElementById(prevId);
      var nextBtn = document.getElementById(nextId);
      var info = document.getElementById(infoId);
      if (!prevBtn || !nextBtn) return;

      function render() {
        var start = (currentPage - 1) * perPage;
        var end = start + perPage;
        rows.forEach(function(row, i) {
          row.style.display = (i >= start && i < end) ? '' : 'none';
        });
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        if (info) info.textContent = 'Page ' + currentPage + ' of ' + totalPages;
      }

      prevBtn.addEventListener('click', function() {
        if (currentPage > 1) { currentPage--; render(); }
      });
      nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) { currentPage++; render(); }
      });
      render();
    }

    setupPagination('qc-feedback-row', 'qc-feedback-prev', 'qc-feedback-next', 'qc-feedback-page-info', 10);
    setupPagination('qc-version-row', 'qc-version-prev', 'qc-version-next', 'qc-version-page-info', 10);
  })();
  </script>
  <?php
}

/**
 * QC Settings Page (renamed from original admin page)
 */
function qchf_render_settings_page() {
  if (!current_user_can('manage_options')) {
    wp_die('Unauthorized');
  }

  // Handle settings save
  if (isset($_POST['qchf_save_settings']) && check_admin_referer('qchf_save_settings')) {
    $custom_login_slug = sanitize_title($_POST['qchf_custom_login_slug'] ?? '');
    $hide_menus = isset($_POST['qchf_hide_menus']) ? array_map('sanitize_text_field', $_POST['qchf_hide_menus']) : [];
    $restrict_admin = isset($_POST['qchf_restrict_admin']) ? 1 : 0;
    
    update_option('qchf_custom_login_slug', $custom_login_slug);
    update_option('qchf_hide_menus', $hide_menus);
    update_option('qchf_restrict_admin', $restrict_admin);
    
    echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
  }

  if (isset($_POST['qchf_revoke_user_id']) && check_admin_referer('qchf_revoke_token')) {
    $user_id = (int) $_POST['qchf_revoke_user_id'];
    if ($user_id > 0) {
      qchf_revoke_user_token($user_id);
      echo '<div class="notice notice-success"><p>Token revoked.</p></div>';
    }
  }

  // Handle orphan cleanup
  if (isset($_POST['qchf_cleanup_orphans']) && check_admin_referer('qchf_cleanup_orphans')) {
    $cleanup_results = qchf_cleanup_orphan_entries();
    echo '<div class="notice notice-success"><p>' . esc_html($cleanup_results) . '</p></div>';
  }

  // Get current settings
  $custom_login_slug = get_option('qchf_custom_login_slug', '');
  $hide_menus = get_option('qchf_hide_menus', []);
  $restrict_admin = get_option('qchf_restrict_admin', 0);

  $users = get_users(['fields' => ['ID', 'user_login', 'user_email', 'display_name']]);

  echo '<div class="wrap">';
  echo '<h1>QC Settings</h1>';
  
  // Security Settings Section
  echo '<h2>Security Settings</h2>';
  echo '<form method="post">';
  wp_nonce_field('qchf_save_settings');
  echo '<input type="hidden" name="qchf_save_settings" value="1" />';
  
  echo '<table class="form-table">';
  
  // Custom Login URL
  echo '<tr>';
  echo '<th scope="row"><label for="qchf_custom_login_slug">Custom Login URL</label></th>';
  echo '<td>';
  echo '<code>' . esc_html(home_url('/')) . '</code>';
  echo '<input type="text" id="qchf_custom_login_slug" name="qchf_custom_login_slug" value="' . esc_attr($custom_login_slug) . '" class="regular-text" placeholder="my-secret-login" />';
  echo '<p class="description">Set a custom login URL slug. Leave empty to use default <code>/wp-login.php</code>. When set, accessing <code>/wp-login.php</code> will redirect to 404.</p>';
  if ($custom_login_slug) {
    echo '<p><strong>Your login URL:</strong> <code>' . esc_html(home_url('/' . $custom_login_slug)) . '</code></p>';
  }
  echo '</td>';
  echo '</tr>';
  
  // Restrict Admin Access
  echo '<tr>';
  echo '<th scope="row">Restrict Admin Access</th>';
  echo '<td>';
  echo '<label><input type="checkbox" name="qchf_restrict_admin" value="1" ' . checked($restrict_admin, 1, false) . ' /> Only allow administrators to access the WordPress admin area</label>';
  echo '<p class="description">Non-admin users will be redirected to the homepage when trying to access wp-admin.</p>';
  echo '</td>';
  echo '</tr>';
  
  // Hide Menu Items
  echo '<tr>';
  echo '<th scope="row">Hide Admin Menu Items</th>';
  echo '<td>';
  echo '<p class="description">Select menu items to hide from non-administrator users:</p>';
  
  $available_menus = [
    'edit.php' => 'Posts',
    'upload.php' => 'Media',
    'edit.php?post_type=page' => 'Pages',
    'edit-comments.php' => 'Comments',
    'themes.php' => 'Appearance',
    'plugins.php' => 'Plugins',
    'users.php' => 'Users',
    'tools.php' => 'Tools',
    'options-general.php' => 'Settings',
  ];
  
  echo '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 600px;">';
  foreach ($available_menus as $menu_slug => $menu_name) {
    $checked = in_array($menu_slug, $hide_menus) ? 'checked' : '';
    echo '<label style="display: flex; align-items: center; gap: 6px;">';
    echo '<input type="checkbox" name="qchf_hide_menus[]" value="' . esc_attr($menu_slug) . '" ' . $checked . ' />';
    echo esc_html($menu_name);
    echo '</label>';
  }
  echo '</div>';
  echo '</td>';
  echo '</tr>';
  
  echo '</table>';
  
  echo '<p class="submit"><button type="submit" class="button button-primary">Save Security Settings</button></p>';
  echo '</form>';
  
  echo '<hr style="margin: 30px 0;" />';
  
  // Orphan Cleanup Section
  echo '<h2>Database Cleanup</h2>';
  echo '<p>Clean up orphan entries that may appear in URL filter dropdowns but have no associated posts.</p>';
  
  // Show current orphan count
  global $wpdb;
  $orphan_meta = $wpdb->get_var("
    SELECT COUNT(DISTINCT pm.meta_id)
    FROM {$wpdb->postmeta} pm
    LEFT JOIN {$wpdb->posts} p ON pm.post_id = p.ID
    WHERE pm.meta_key = 'qchf_url'
    AND (p.ID IS NULL OR p.post_status = 'trash' OR p.post_status = 'auto-draft')
  ");
  
  $trash_versions = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'qc_version' AND post_status IN ('trash', 'auto-draft')");
  $trash_feedback = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'qc_feedback' AND post_status IN ('trash', 'auto-draft')");
  
  echo '<table class="widefat" style="max-width: 500px; margin-bottom: 20px;">';
  echo '<tr><td><strong>Orphan URL metadata entries:</strong></td><td>' . esc_html($orphan_meta) . '</td></tr>';
  echo '<tr><td><strong>QC Versions in trash/draft:</strong></td><td>' . esc_html($trash_versions) . '</td></tr>';
  echo '<tr><td><strong>QC Feedback in trash/draft:</strong></td><td>' . esc_html($trash_feedback) . '</td></tr>';
  echo '</table>';
  
  echo '<form method="post" style="margin-bottom: 30px;">';
  wp_nonce_field('qchf_cleanup_orphans');
  echo '<input type="hidden" name="qchf_cleanup_orphans" value="1" />';
  echo '<button class="button button-primary" onclick="return confirm(\'This will permanently delete orphan entries and empty trash. Continue?\');">Clean Up Orphan Entries</button>';
  echo '</form>';
  
  echo '<hr style="margin: 30px 0;" />';
  
  // User Tokens Section
  echo '<h2>User Tokens</h2>';
  echo '<p>Users must log in from the extension to obtain a token. You can revoke a user\'s current token here.</p>';

  echo '<table class="widefat striped">';
  echo '<thead><tr><th>User</th><th>Email</th><th>Token Status</th><th>Actions</th></tr></thead>';
  echo '<tbody>';

  foreach ($users as $u) {
    $hash = get_user_meta($u->ID, QCHF_USER_META_TOKEN_HASH, true);
    $created = (int) get_user_meta($u->ID, QCHF_USER_META_TOKEN_CREATED_AT, true);
    $status = $hash ? ('Active (created ' . esc_html(human_time_diff($created, time())) . ' ago)') : 'None';

    echo '<tr>';
    echo '<td>' . esc_html($u->display_name) . ' <code>' . esc_html($u->user_login) . '</code></td>';
    echo '<td>' . esc_html($u->user_email) . '</td>';
    echo '<td>' . esc_html($status) . '</td>';
    echo '<td>';

    if ($hash) {
      echo '<form method="post" style="display:inline">';
      wp_nonce_field('qchf_revoke_token');
      echo '<input type="hidden" name="qchf_revoke_user_id" value="' . esc_attr($u->ID) . '" />';
      echo '<button class="button">Revoke Token</button>';
      echo '</form>';
    } else {
      echo '—';
    }

    echo '</td>';
    echo '</tr>';
  }

  echo '</tbody>';
  echo '</table>';
  echo '</div>';
}

/**
 * Clean up orphan entries from database
 */
function qchf_cleanup_orphan_entries() {
  global $wpdb;
  
  $deleted_meta = 0;
  $deleted_versions = 0;
  $deleted_feedback = 0;
  $deleted_attachments = 0;
  
  // 1. Delete orphan postmeta (meta entries where post doesn't exist or is trashed)
  $orphan_meta_ids = $wpdb->get_col("
    SELECT pm.meta_id
    FROM {$wpdb->postmeta} pm
    LEFT JOIN {$wpdb->posts} p ON pm.post_id = p.ID
    WHERE pm.meta_key LIKE 'qchf_%'
    AND (p.ID IS NULL OR p.post_status = 'trash' OR p.post_status = 'auto-draft')
  ");
  
  if (!empty($orphan_meta_ids)) {
    $ids_string = implode(',', array_map('intval', $orphan_meta_ids));
    $deleted_meta = $wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_id IN ({$ids_string})");
  }
  
  // 2. Permanently delete trashed/auto-draft QC Versions (and their attachments)
  $trash_versions = get_posts([
    'post_type' => 'qc_version',
    'post_status' => ['trash', 'auto-draft'],
    'posts_per_page' => -1,
    'fields' => 'ids',
  ]);
  
  foreach ($trash_versions as $post_id) {
    // Delete attachments first
    $thumb_id = get_post_thumbnail_id($post_id);
    if ($thumb_id) {
      wp_delete_attachment($thumb_id, true);
      $deleted_attachments++;
    }
    $attachments = get_posts([
      'post_type' => 'attachment',
      'posts_per_page' => -1,
      'post_parent' => $post_id,
      'fields' => 'ids',
    ]);
    foreach ($attachments as $att_id) {
      wp_delete_attachment($att_id, true);
      $deleted_attachments++;
    }
    // Delete the post permanently
    wp_delete_post($post_id, true);
    $deleted_versions++;
  }
  
  // 3. Permanently delete trashed/auto-draft QC Feedback (and their attachments)
  $trash_feedback = get_posts([
    'post_type' => 'qc_feedback',
    'post_status' => ['trash', 'auto-draft'],
    'posts_per_page' => -1,
    'fields' => 'ids',
  ]);
  
  foreach ($trash_feedback as $post_id) {
    // Delete attachments first
    $thumb_id = get_post_thumbnail_id($post_id);
    if ($thumb_id) {
      wp_delete_attachment($thumb_id, true);
      $deleted_attachments++;
    }
    $attachments = get_posts([
      'post_type' => 'attachment',
      'posts_per_page' => -1,
      'post_parent' => $post_id,
      'fields' => 'ids',
    ]);
    foreach ($attachments as $att_id) {
      wp_delete_attachment($att_id, true);
      $deleted_attachments++;
    }
    // Delete the post permanently
    wp_delete_post($post_id, true);
    $deleted_feedback++;
  }
  
  return sprintf(
    'Cleanup complete: %d orphan meta entries, %d versions, %d feedback posts, %d media files deleted.',
    $deleted_meta,
    $deleted_versions,
    $deleted_feedback,
    $deleted_attachments
  );
}

/**
 * Versioning Admin Columns
 */
add_filter('manage_qc_version_posts_columns', function($columns) {
  $new_columns = [];
  foreach ($columns as $key => $value) {
    if ($key === 'title') {
      $new_columns['qc_thumbnail'] = 'Snapshot';
    }
    $new_columns[$key] = $value;
    if ($key === 'title') {
      $new_columns['qc_version_num'] = 'Ver';
      $new_columns['qc_url'] = 'URL';
      $new_columns['qc_comment'] = 'Comment';
    }
  }
  return $new_columns;
});

add_action('manage_qc_version_posts_custom_column', function($column, $post_id) {
  switch ($column) {
    case 'qc_thumbnail':
      $url = get_the_post_thumbnail_url($post_id, 'thumbnail');
      if ($url) {
        echo '<img src="' . esc_url($url) . '" style="width:100px; height:auto; display:block; border:1px solid #ddd;" />';
      } else {
        echo '—';
      }
      break;
    case 'qc_version_num':
      $url = get_post_meta($post_id, 'qchf_url', true);
      if ($url) {
        global $wpdb;
        $count = $wpdb->get_var($wpdb->prepare("
          SELECT COUNT(*)
          FROM {$wpdb->posts} p
          JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
          WHERE p.post_type = 'qc_version'
          AND p.post_status = 'publish'
          AND pm.meta_key = 'qchf_url'
          AND pm.meta_value = %s
          AND p.post_date <= (SELECT post_date FROM {$wpdb->posts} WHERE ID = %d)
        ", $url, $post_id));
        echo '<strong>V' . esc_html($count) . '</strong>';
      } else {
        echo '—';
      }
      break;
    case 'qc_url':
      $url = get_post_meta($post_id, 'qchf_url', true);
      if ($url) {
        echo '<a href="' . esc_url($url) . '" target="_blank" style="word-break: break-all; font-size: 11px;">' . esc_html($url) . '</a>';
      } else {
        echo '—';
      }
      break;
    case 'qc_comment':
      $comment = get_post_field('post_content', $post_id);
      if ($comment) {
        echo '<div style="font-style: italic; color: #555; max-width: 300px;">' . esc_html($comment) . '</div>';
      } else {
        echo '<span style="color: #ccc;">No comment</span>';
      }
      break;
  }
}, 10, 2);

/**
 * Feedback Admin Columns
 */
add_filter('manage_qc_feedback_posts_columns', function($columns) {
  $new_columns = [];
  if (isset($columns['cb'])) {
    $new_columns['cb'] = $columns['cb'];
  }
  $new_columns['qc_thumbnail'] = 'Snapshot';
  $new_columns['qc_marker'] = 'Marker';
  
  foreach ($columns as $key => $value) {
    if ($key === 'cb' || $key === 'author') continue;
    $new_columns[$key] = $value;
    if ($key === 'title') {
      $new_columns['qc_author'] = 'Author';
      $new_columns['qc_url'] = 'URL';
      $new_columns['qc_attachment'] = 'Attachment';
      $new_columns['qc_status'] = 'Status';
    }
  }
  return $new_columns;
});

add_action('manage_qc_feedback_posts_custom_column', function($column, $post_id) {
  switch ($column) {
    case 'qc_thumbnail':
      $url = get_the_post_thumbnail_url($post_id, 'thumbnail');
      if ($url) {
        echo '<img src="' . esc_url($url) . '" style="width:100px; height:auto; display:block; border:1px solid #ddd;" />';
      } else {
        echo '—';
      }
      break;
    case 'qc_marker':
      $num = get_post_meta($post_id, 'qchf_marker_num', true);
      $color = get_post_meta($post_id, 'qchf_marker_color', true) ?: '#ff4757';
      if ($num) {
        echo '<span style="background:' . esc_attr($color) . '; color:white; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:bold;">' . esc_html($num) . '</span>';
      } else {
        echo '—';
      }
      break;
    case 'qc_author':
      $author_name = get_post_meta($post_id, 'qchf_author_name', true);
      if (!$author_name) {
        $author_id = get_post_field('post_author', $post_id);
        if ($author_id) {
          $user = get_userdata($author_id);
          $author_name = $user ? ($user->display_name ?: $user->user_login) : 'Unknown';
        }
      }
      echo '<strong>' . esc_html($author_name ?: 'Unknown') . '</strong>';
      break;
    case 'qc_url':
      $url = get_post_meta($post_id, 'qchf_url', true);
      if ($url) {
        echo '<a href="' . esc_url($url) . '" target="_blank" style="font-size:11px; word-break:break-all;">' . esc_html($url) . '</a>';
      } else {
        echo '—';
      }
      break;
    case 'qc_attachment':
      $att_id = get_post_meta($post_id, 'qchf_attachment_id', true);
      if ($att_id) {
        $att_url = wp_get_attachment_url($att_id);
        $att_name = basename(get_attached_file($att_id) ?: '');
        $att_mime = get_post_mime_type($att_id);
        $is_image = $att_mime && strpos($att_mime, 'image/') === 0;
        if ($is_image && $att_url) {
          echo '<a href="' . esc_url($att_url) . '" target="_blank"><img src="' . esc_url($att_url) . '" style="width:60px; height:auto; border:1px solid #ddd; border-radius:3px;" /></a>';
        } elseif ($att_url) {
          echo '<a href="' . esc_url($att_url) . '" target="_blank" style="font-size:11px; word-break:break-all;">' . esc_html($att_name) . '</a>';
        }
      } else {
        echo '<span style="color:#ccc;">—</span>';
      }
      break;
    case 'qc_status':
      $resolved_by = get_post_meta($post_id, 'qchf_resolved_by', true);
      $resolved_at = get_post_meta($post_id, 'qchf_resolved_at', true);
      if ($resolved_by) {
        echo '<span style="color:#2ed573; font-weight:600;">✓ Resolved</span><br/>';
        echo '<small style="color:#666;">By ' . esc_html($resolved_by) . '<br/>' . esc_html(date('Y/m/d H:i', strtotime($resolved_at))) . '</small>';
      } else {
        echo '<span style="color:#ff4757; font-weight:600;">Open</span>';
      }
      break;
  }
}, 10, 2);

/**
 * Bug Report Admin Columns
 */
add_filter('manage_qc_bug_posts_columns', function($columns) {
  $new_columns = [];
  if (isset($columns['cb'])) {
    $new_columns['cb'] = $columns['cb'];
  }
  $new_columns['qc_bug_screenshot'] = 'Screenshot';
  
  foreach ($columns as $key => $value) {
    if ($key === 'cb' || $key === 'author') continue;
    $new_columns[$key] = $value;
    if ($key === 'title') {
      $new_columns['qc_bug_submitter'] = 'Submitter';
      $new_columns['qc_bug_message'] = 'Message';
      $new_columns['qc_bug_url'] = 'Page URL';
    }
  }
  return $new_columns;
});

add_action('manage_qc_bug_posts_custom_column', function($column, $post_id) {
  switch ($column) {
    case 'qc_bug_screenshot':
      $url = get_the_post_thumbnail_url($post_id, 'thumbnail');
      if ($url) {
        echo '<img src="' . esc_url($url) . '" style="width:100px; height:auto; display:block; border:1px solid #ddd;" />';
      } else {
        echo '<span style="color:#ccc;">—</span>';
      }
      break;
    case 'qc_bug_submitter':
      $submitter = get_post_meta($post_id, 'qchf_bug_submitter', true);
      if ($submitter) {
        echo '<strong>' . esc_html($submitter) . '</strong>';
      } else {
        echo '—';
      }
      break;
    case 'qc_bug_message':
      $content = get_post_field('post_content', $post_id);
      if ($content) {
        $short = mb_strlen($content) > 120 ? mb_substr($content, 0, 120) . '…' : $content;
        echo '<div style="font-style: italic; color: #555; max-width: 300px;">' . esc_html($short) . '</div>';
      } else {
        echo '<span style="color: #ccc;">No message</span>';
      }
      break;
    case 'qc_bug_url':
      $url = get_post_meta($post_id, 'qchf_url', true);
      if ($url) {
        echo '<a href="' . esc_url($url) . '" target="_blank" style="font-size:11px; word-break:break-all;">' . esc_html($url) . '</a>';
      } else {
        echo '—';
      }
      break;
  }
}, 10, 2);

/**
 * Add Resolve row action for Feedback
 */
add_filter('post_row_actions', function($actions, $post) {
  if ($post->post_type !== 'qc_feedback') return $actions;
  
  $resolved_by = get_post_meta($post->ID, 'qchf_resolved_by', true);
  if (!$resolved_by) {
    $url = wp_nonce_url(admin_url('edit.php?post_type=qc_feedback&qchf_resolve=' . $post->ID), 'qchf_resolve_feedback');
    $actions['resolve'] = '<a href="' . esc_url($url) . '" style="color:#2ed573; font-weight:600;">Resolve</a>';
  } else {
    $url = wp_nonce_url(admin_url('edit.php?post_type=qc_feedback&qchf_unresolve=' . $post->ID), 'qchf_unresolve_feedback');
    $actions['unresolve'] = '<a href="' . esc_url($url) . '" style="color:#ff4757; font-weight:600;">Re-open</a>';
  }
  
  return $actions;
}, 10, 2);

/**
 * Handle Resolve/Unresolve action from Admin List
 */
add_action('admin_init', function() {
  if (isset($_GET['qchf_resolve']) && check_admin_referer('qchf_resolve_feedback')) {
    $post_id = (int)$_GET['qchf_resolve'];
    $user = wp_get_current_user();
    
    update_post_meta($post_id, 'qchf_resolved_by', $user->display_name ?: $user->user_login);
    update_post_meta($post_id, 'qchf_resolved_at', current_time('c'));
    
    wp_redirect(remove_query_arg(['qchf_resolve', '_wpnonce'], wp_get_referer()));
    exit;
  }

  if (isset($_GET['qchf_unresolve']) && check_admin_referer('qchf_unresolve_feedback')) {
    $post_id = (int)$_GET['qchf_unresolve'];
    
    delete_post_meta($post_id, 'qchf_resolved_by');
    delete_post_meta($post_id, 'qchf_resolved_at');
    
    wp_redirect(remove_query_arg(['qchf_unresolve', '_wpnonce'], wp_get_referer()));
    exit;
  }
});

/**
 * Filter by URL in Admin List - for both QC Version and QC Feedback
 */
add_action('restrict_manage_posts', function($post_type) {
  if (!in_array($post_type, ['qc_version', 'qc_feedback', 'qc_bug'])) return;

  global $wpdb;
  $results = $wpdb->get_results($wpdb->prepare("
    SELECT pm.meta_value as url, MAX(p.post_title) as title
    FROM {$wpdb->postmeta} pm
    JOIN {$wpdb->posts} p ON p.ID = pm.post_id
    WHERE pm.meta_key = 'qchf_url'
    AND p.post_type = %s
    GROUP BY pm.meta_value
    ORDER BY title ASC
  ", $post_type));

  $selected = isset($_GET['qc_url_filter']) ? $_GET['qc_url_filter'] : '';

  echo '<select name="qc_url_filter">';
  echo '<option value="">All URLs</option>';
  foreach ($results as $res) {
    // Strip the timestamp from the title if it exists to show a cleaner page title
    $display_title = preg_replace('/ - \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', '', $res->title);
    
    printf(
      '<option value="%s" %s>%s</option>',
      esc_attr($res->url),
      selected($selected, $res->url, false),
      esc_html($display_title ?: $res->url)
    );
  }
  echo '</select>';
});

add_filter('parse_query', function($query) {
  global $pagenow;
  if (is_admin() && $pagenow === 'edit.php' && isset($query->query_vars['post_type'])) {
    $post_type = $query->query_vars['post_type'];
    if (in_array($post_type, ['qc_version', 'qc_feedback', 'qc_bug']) && !empty($_GET['qc_url_filter'])) {
      $query->query_vars['meta_query'][] = [
        'key' => 'qchf_url',
        'value' => $_GET['qc_url_filter'],
        'compare' => '='
      ];
    }
  }
});

/**
 * Delete associated media files when QC Version or QC Feedback is deleted
 */
add_action('before_delete_post', function($post_id) {
  $post = get_post($post_id);
  if (!$post || !in_array($post->post_type, ['qc_version', 'qc_feedback'])) {
    return;
  }
  
  // Get the featured image (thumbnail) attachment ID
  $thumbnail_id = get_post_thumbnail_id($post_id);
  if ($thumbnail_id) {
    // Delete the attachment and its files
    wp_delete_attachment($thumbnail_id, true);
  }
  
  // Also check for any other attachments attached to this post
  $attachments = get_posts([
    'post_type' => 'attachment',
    'posts_per_page' => -1,
    'post_parent' => $post_id,
  ]);
  
  foreach ($attachments as $attachment) {
    wp_delete_attachment($attachment->ID, true);
  }
});

/**
 * Custom Login URL - Redirect default wp-login.php to 404
 */
add_action('init', function() {
  $custom_slug = get_option('qchf_custom_login_slug', '');
  if (empty($custom_slug)) return;
  
  // Check if accessing wp-login.php directly
  $request_uri = $_SERVER['REQUEST_URI'] ?? '';
  if (strpos($request_uri, 'wp-login.php') !== false && !isset($_GET[$custom_slug])) {
    // Allow logout and other actions
    $action = $_GET['action'] ?? '';
    if (!in_array($action, ['logout', 'postpass', 'rp', 'resetpass', 'lostpassword'])) {
      wp_safe_redirect(home_url('/404'));
      exit;
    }
  }
});

/**
 * Custom Login URL - Handle custom slug
 */
add_action('init', function() {
  $custom_slug = get_option('qchf_custom_login_slug', '');
  if (empty($custom_slug)) return;
  
  $request_uri = trim($_SERVER['REQUEST_URI'] ?? '', '/');
  $request_uri = explode('?', $request_uri)[0]; // Remove query string
  
  if ($request_uri === $custom_slug) {
    // Redirect to wp-login.php with the secret parameter
    wp_safe_redirect(add_query_arg($custom_slug, '1', wp_login_url()));
    exit;
  }
});

/**
 * Restrict Admin Access for non-administrators
 */
add_action('admin_init', function() {
  if (!get_option('qchf_restrict_admin', 0)) return;
  if (current_user_can('manage_options')) return;
  if (wp_doing_ajax()) return;
  
  wp_safe_redirect(home_url());
  exit;
});

/**
 * Hide Menu Items for non-administrators
 */
add_action('admin_menu', function() {
  if (current_user_can('manage_options')) return;
  
  $hide_menus = get_option('qchf_hide_menus', []);
  if (empty($hide_menus)) return;
  
  foreach ($hide_menus as $menu_slug) {
    remove_menu_page($menu_slug);
  }
}, 999);

/**
 * Hide Admin Bar for non-administrators (optional)
 */
add_action('after_setup_theme', function() {
  if (!get_option('qchf_restrict_admin', 0)) return;
  if (current_user_can('manage_options')) return;
  
  show_admin_bar(false);
});
