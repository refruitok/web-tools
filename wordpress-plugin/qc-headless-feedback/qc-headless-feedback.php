<?php
/**
 * Plugin Name: QC Headless Feedback
 * Description: REST login + feedback storage for QC Chrome Extension.
 * Version: 0.1.0
 */

defined('ABSPATH') || exit;

define('QCHF_VERSION', '0.1.0');
define('QCHF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('QCHF_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once QCHF_PLUGIN_DIR . 'includes/auth.php';
require_once QCHF_PLUGIN_DIR . 'includes/cpt.php';
require_once QCHF_PLUGIN_DIR . 'includes/rest.php';
require_once QCHF_PLUGIN_DIR . 'includes/admin.php';

qchf_register_cpt();
add_action('rest_api_init', 'qchf_register_rest_routes');
add_action('admin_menu', 'qchf_register_admin_menu');
