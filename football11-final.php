<?php
/**
 * Plugin Name: بت لحظه – نمایش نتایج زنده و پیش‌بینی
 * Description: نمایش نتایج زنده فوتبال و اطلاعات پیش‌بینی با استفاده از API-Football
 * Version: 2.1.0
 * Author: You
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit;

class Football11_Final_Plugin {
  const OPT = 'f11_final_opts';

  function __construct(){
    add_action('admin_menu', [$this,'menu']);
    add_action('admin_init', [$this,'register']);
    add_shortcode('betlahze', [$this,'shortcode']);
    add_action('wp_enqueue_scripts', [$this,'assets']);
    add_action('admin_enqueue_scripts', [$this,'adminAssets']);
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this,'links']);
  }

  /* Admin */
  function menu(){ add_options_page('بت لحظه','بت لحظه','manage_options','f11-final',[$this,'settings']); }
  function register(){ register_setting('f11_final_group', self::OPT, ['sanitize_callback'=>[$this,'sanitize_opts']]); }
  function links($links){ $url = admin_url('options-general.php?page=f11-final'); $links[] = '<a href="'.$url.'">Settings</a>'; return $links; }

  function sanitize_opts($in){
    $out = [];
    $out['key']       = isset($in['key'])  ? trim($in['key'])  : '';
    $out['host']      = isset($in['host']) ? trim($in['host']) : 'api-football-v1.p.rapidapi.com';
    $base             = isset($in['base']) ? trim($in['base']) : 'https://api-football-v1.p.rapidapi.com/v3';
    $out['base']      = esc_url_raw($base);
    $out['tz']        = isset($in['tz'])   ? sanitize_text_field($in['tz']) : 'Asia/Tehran';
    $out['ttl_live']  = max(0, intval($in['ttl_live']  ?? 0));
    $out['ttl_other'] = max(0, intval($in['ttl_other'] ?? 0));
    $out['max_pages'] = max(1, min(10, intval($in['max_pages'] ?? 3)));
    $out['page_delay'] = max(0, min(2000, intval($in['page_delay'] ?? 500)));
    return $out;
  }

  function settings(){
    $o = get_option(self::OPT, []);
    $key  = esc_attr($o['key']  ?? '');
    $host = esc_attr($o['host'] ?? 'api-football-v1.p.rapidapi.com');
    $base = esc_attr($o['base'] ?? 'https://api-football-v1.p.rapidapi.com/v3');
    $tz   = esc_attr($o['tz']   ?? 'Asia/Tehran');
    $ttlL = max(0, intval($o['ttl_live']  ?? 0));
    $ttlO = max(0, intval($o['ttl_other'] ?? 0));
    ?>
    <div class="wrap">
      <h1>تنظیمات افزونه بت لحظه (اتصال مستقیم به API)</h1>
      <?php if(isset($_GET['settings-updated'])) echo '<div class="updated notice"><p>Settings saved.</p></div>'; ?>
      
      <!-- API-Football Info Box -->
      <div style="background: #e7f3ff; border: 1px solid #0073aa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #0073aa;">⚽ API-Football Direct Integration</h3>
        <p style="margin-bottom: 15px;">
          این افزونه مستقیماً از <strong><a href="https://rapidapi.com/api-sports/api/api-football" target="_blank">API-Football</a></strong> استفاده می‌کند.
          <strong>نکته:</strong> API Key شما در JavaScript قابل مشاهده خواهد بود.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; color: #0073aa;">📊 ویژگی‌ها</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>اتصال مستقیم به API</li>
              <li>بدون تأخیر WordPress</li>
              <li>عملکرد بهتر</li>
              <li>سادگی کد</li>
            </ul>
          </div>
          <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; color: #0073aa;">🔑 نحوه دریافت API Key</h4>
            <ol style="margin: 0; padding-left: 20px;">
              <li>به <a href="https://rapidapi.com/api-sports/api/api-football" target="_blank">RapidAPI</a> بروید</li>
              <li>حساب کاربری ایجاد کنید</li>
              <li>API-Football را subscribe کنید</li>
              <li>API Key را کپی کنید</li>
            </ol>
          </div>
        </div>
      </div>
      
      <form method="post" action="options.php">
        <?php settings_fields('f11_final_group'); do_settings_sections('f11_final_group'); ?>
        <table class="form-table" role="presentation">
          <tr><th scope="row"><label for="f11_key">x-rapidapi-key</label></th>
              <td><input id="f11_key" name="<?=self::OPT?>[key]" value="<?=$key?>" class="regular-text" required>
              <p class="description">API Key خود را از <a href="https://rapidapi.com/api-sports/api/api-football" target="_blank">RapidAPI</a> دریافت کنید</p></td></tr>
          <tr><th scope="row"><label for="f11_host">x-rapidapi-host</label></th>
              <td><input id="f11_host" name="<?=self::OPT?>[host]" value="<?=$host?>" class="regular-text">
              <p class="description">مقدار پیش‌فرض: <code>api-football-v1.p.rapidapi.com</code></p></td></tr>
          <tr><th scope="row"><label for="f11_base">Base URL</label></th>
              <td><input id="f11_base" name="<?=self::OPT?>[base]" value="<?=$base?>" class="regular-text">
              <p class="description">مقدار پیش‌فرض: <code>https://api-football-v1.p.rapidapi.com/v3</code></p></td></tr>
          <tr><th scope="row"><label for="f11_tz">Default Timezone</label></th>
              <td><input id="f11_tz" name="<?=self::OPT?>[tz]" value="<?=$tz?>" class="regular-text">
              <p class="description">مقدار پیش‌فرض: <code>Asia/Tehran</code></p></td></tr>
          <tr><th scope="row">Cache TTL (sec)</th>
              <td>Live <input type="number" name="<?=self::OPT?>[ttl_live]" value="<?=$ttlL?>" style="width:90px">
                  &nbsp;|&nbsp; Other <input type="number" name="<?=self::OPT?>[ttl_other]" value="<?=$ttlO?>" style="width:90px">
          <tr><th scope="row">Pagination Settings</th>
              <td>Max Pages <input type="number" name="<?=self::OPT?>[max_pages]" value="<?=esc_attr($o['max_pages'] ?? 3)?>" style="width:90px" min="1" max="10">
                  &nbsp;|&nbsp; Page Delay (ms) <input type="number" name="<?=self::OPT?>[page_delay]" value="<?=esc_attr($o['page_delay'] ?? 500)?>" style="width:90px" min="0" max="2000">
                  <p class="description">Max Pages: تعداد صفحات برای دریافت نتایج (1-10) | Page Delay: تأخیر بین درخواست‌ها (0-2000ms)</p></td></tr>
              <p class="description">زمان ذخیره‌سازی داده‌ها در کش (ثانیه)</p></td></tr>
        </table>
        <?php submit_button(); ?>
      </form>
      
      <hr>
      <p>Shortcode: <code>[betlahze season="2025"]</code> یا <code>[betlahze league="39" season="2025"]</code></p>
    </div>
    <?php
  }

  /* Assets */
  function assets() {
    $ver = '3.0.0';
    $o = get_option(self::OPT, []);
    
    wp_enqueue_style('football11-app', plugins_url('assets/css/app.css', __FILE__), [], $ver);
    wp_enqueue_script('football11-main', plugins_url('assets/js/main.js', __FILE__), ['jquery'], $ver, true);
    wp_enqueue_script('football11-api', plugins_url('assets/js/api.js', __FILE__), ['football11-main'], $ver, true);
    wp_enqueue_script('football11-ui', plugins_url('assets/js/ui.js', __FILE__), ['football11-main'], $ver, true);
    
    wp_localize_script('football11-main', 'F11COMPLETE', [
      'api' => [
        'key' => $o['key'] ?? '',
        'host' => $o['host'] ?? 'api-football-v1.p.rapidapi.com',
        'base' => $o['base'] ?? 'https://api-football-v1.p.rapidapi.com/v3',
        'timezone' => $o['tz'] ?? 'Asia/Tehran'
      ],
      'cache' => [
        'live_ttl' => intval($o['ttl_live'] ?? 45),
        'other_ttl' => intval($o['ttl_other'] ?? 300)
      ],
      'pagination' => [
        'maxPages' => intval($o['max_pages'] ?? 3),
        'delayBetweenPages' => intval($o['page_delay'] ?? 500),
        'maxResultsPerPage' => 100,
        'enableInfiniteScroll' => true,
        'loadMoreThreshold' => 100,
        'autoLoadMore' => true
      ]
    ]);
  }

  /* Admin Assets */
  function adminAssets($hook) {
    if ($hook !== 'settings_page_f11-final') return;
    
    $ver = '2.0.0';
    wp_enqueue_script('football11-admin', plugins_url('assets/js/admin.js', __FILE__), ['jquery'], $ver, true);
  }

  /* Shortcode */
  function shortcode($atts){
    $a = shortcode_atts([
      'league'   => '',
      'season'   => '',
      'timezone' => '',
    ], $atts, 'betlahze');

    $o = get_option(self::OPT, []);
    $cfg = [
      'league'   => $a['league'],
      'season'   => $a['season'],
      'timezone' => $a['timezone'] ?: ($o['tz'] ?? 'Asia/Tehran'),
    ];

    ob_start(); ?>
    <div class="football11-app" data-cfg='<?=json_encode($cfg, JSON_UNESCAPED_UNICODE)?>'>
      <!-- Header -->
      <div class="header">
        <div class="brand-row">
          <div class="pull-right">
            <a href="#" class="brand-name">
              <h1>بت لحظه</h1>
              <h2>پیش‌بینی و نتایج زنده</h2>
            </a>
          </div>
          <div class="pull-left">
            <div class="search-box-container">
              <input type="text" placeholder="جستجو در مسابقات، تیم‌ها و بازیکنان..." />
              <button type="button">
                <i class="fa fa-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Tab Navigation -->
      <div class="top-tab-list">
        <a href="#" class="tab active" data-date="today">امروز</a>
        <a href="#" class="tab" data-date="yesterday">دیروز</a>
        <a href="#" class="tab" data-date="tomorrow">فردا</a>
    
      </div>

      <!-- Main Container -->
      <div class="livescore-container page-container clearfix">
        <!-- Left Sidebar - League Details (Independent) -->
        <div class="livescore-left-box league-details-left" id="league-details-left" style="display: none;">
          <div class="league-details-container box-shadow">
            <div class="matches-title">
              <span>اطلاعات لیگ</span>
              <a href="#" class="close-league-left">&times;</a>
            </div>
            <div class="league-details-content">
              <!-- League Header -->
              <div class="league-header">
                <div class="league-info">
                  <img class="league-logo" id="left-league-logo" src="" alt="League Logo">
                  <div class="league-details">
                    <h3 id="left-league-name">نام لیگ</h3>
                    <p id="left-league-country">کشور</p>
                    <p id="left-league-type">نوع</p>
                  </div>
                </div>
                <div class="league-actions">
                  <select id="left-season-selector" class="season-selector">
                    <!-- Seasons will be loaded dynamically -->
                  </select>
                </div>
              </div>

              <!-- League Navigation Tabs -->
              <div class="league-nav-tabs">
                <ul class="tab-list">
                  <li class="active"><a href="#left-league-overview">نمای کلی</a></li>
                  <li><a href="#left-league-standings">جدول</a></li>
                  <li><a href="#left-league-teams">تیم‌ها</a></li>
                  <li><a href="#left-league-fixtures">مسابقات</a></li>
                  <li><a href="#left-league-stats">آمار</a></li>
                </ul>
              </div>

              <!-- Tab Content -->
              <div class="tab-content active" id="left-league-overview">
                <div class="info-section">
                  <h4>اطلاعات فصل</h4>
                  <ul class="info-list">
                    <li><span class="info-label">تورنمنت:</span> <span class="info-value" id="left-tournament">-</span></li>
                    <li><span class="info-label">فصل:</span> <span class="info-value" id="left-season">-</span></li>
                    <li><span class="info-label">مرحله:</span> <span class="info-value" id="left-stage">-</span></li>
                    <li><span class="info-label">شروع:</span> <span class="info-value" id="left-start">-</span></li>
                    <li><span class="info-label">وضعیت:</span> <span class="info-value" id="left-status">-</span></li>
                  </ul>
                </div>
                <div class="stats-section">
                  <h4>آمار کلی</h4>
                  <div id="left-league-stats">آمار در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="left-league-standings">
                <div class="standings-section">
                  <h4>جدول رده‌بندی</h4>
                  <div id="left-standings-table">جدول در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="left-league-teams">
                <div class="teams-section">
                  <h4>تیم‌های لیگ</h4>
                  <div id="left-teams-grid">تیم‌ها در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="left-league-fixtures">
                <div class="fixtures-section">
                  <h4>مسابقات</h4>
                  <div id="left-fixtures-list">مسابقات در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="left-league-stats">
                <div class="stats-section">
                  <h4>آمار بازیکنان</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <h5>آقای گل</h5>
                      <div id="left-top-scorers">در حال بارگذاری...</div>
                    </div>
                    <div class="stat-item">
                      <h5>پاس‌گل</h5>
                      <div id="left-top-assists">در حال بارگذاری...</div>
                    </div>
                    <div class="stat-item">
                      <h5>کارت‌ها</h5>
                      <div id="left-top-cards">در حال بارگذاری...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Left Sidebar - Match Details (Original) -->
        <div class="livescore-left-box match-details-sidebar" id="match-details-left">
          <div class="match-details-container box-shadow">
            <div class="matches-title">
              <span>جزئیات بازی</span>
              <a href="#" class="close-details">&times;</a>
            </div>
            <div class="match-details-content">
              <!-- Match Header -->
              <div class="match-header">
                <div class="match-teams">
                  <div class="home-team">
                    <img class="team-logo" src="" alt="تیم میزبان">
                    <span class="team-name">تیم میزبان</span>
                  </div>
                  <div class="match-score">
                    <span class="score">0 - 0</span>
                    <span class="match-time">19:00</span>
                  </div>
                  <div class="away-team">
                    <img class="team-logo" src="" alt="تیم میهمان">
                    <span class="team-name">تیم میهمان</span>
                  </div>
                </div>
              </div>

              <!-- Match Navigation Tabs -->
              <div class="match-nav-tabs">
                <ul class="tab-list">
                  <li class="active"><a href="#match-info">اطلاعات</a></li>
                  <li><a href="#match-events">رویدادها</a></li>
                  <li><a href="#match-lineups">ترکیب</a></li>
                  <li><a href="#match-teams">تیم‌ها و بازیکنان</a></li>
                  <li><a href="#match-stats">آمار</a></li>
                </ul>
              </div>

              <!-- Tab Content -->
              <div class="tab-content active" id="match-info">
                <div class="info-section">
                  <h4>اطلاعات مسابقه</h4>
                  <ul class="info-list">
                    <li><span class="info-label">تورنمنت:</span> <span class="info-value">-</span></li>
                    <li><span class="info-label">فصل:</span> <span class="info-value">-</span></li>
                    <li><span class="info-label">مرحله:</span> <span class="info-value">-</span></li>
                    <li><span class="info-label">شروع:</span> <span class="info-value">-</span></li>
                    <li><span class="info-label">وضعیت:</span> <span class="info-value">-</span></li>
                  </ul>
                </div>
              </div>

              <div class="tab-content" id="match-events">
                <div class="events-section">
                  <h4>رویدادهای بازی</h4>
                  <div class="events-timeline">
                    <div class="no-events">هنوز رویدادی ثبت نشده</div>
                  </div>
                </div>
              </div>

              <div class="tab-content" id="match-lineups">
                <div class="lineups-section">
                  <h4>ترکیب تیم‌ها</h4>
                  <div class="lineups-container">
                    <!-- Home Team Lineup -->
                    <div class="home-lineup">
                      <h5>تیم میزبان</h5>
                      <div class="football-field">
                        <div class="formation-info">ترکیب: 4-4-2</div>
                        <div class="field" id="home-field">
                          <!-- Players will be positioned here dynamically -->
                        </div>
                      </div>
                      <div class="lineup-players">
                        <div class="no-lineup">ترکیب هنوز اعلام نشده</div>
                      </div>
                    </div>
                    
                    <!-- Away Team Lineup -->
                    <div class="away-lineup">
                      <h5>تیم میهمان</h5>
                      <div class="football-field">
                        <div class="formation-info">ترکیب: 4-4-2</div>
                        <div class="field" id="away-field">
                          <!-- Players will be positioned here dynamically -->
                        </div>
                      </div>
                      <div class="lineup-players">
                        <div class="no-lineup">ترکیب هنوز اعلام نشده</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tab-content" id="match-teams">
                <div class="teams-section">
                  <h4>تیم‌ها و بازیکنان</h4>
                  <div class="teams-container">
                    <div class="home-team-players">
                      <h5>تیم میزبان</h5>
                      <div class="team-players">
                        <div class="no-players">اطلاعات بازیکنان در حال بارگذاری...</div>
                      </div>
                    </div>
                    <div class="away-team-players">
                      <h5>تیم میهمان</h5>
                      <div class="team-players">
                        <div class="no-players">اطلاعات بازیکنان در حال بارگذاری...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tab-content" id="match-stats">
                <div class="stats-section">
                  <h4>آمار بازی</h4>
                  <div class="stats-container">
                    <div class="stat-row">
                      <span class="stat-label">مالکیت توپ</span>
                      <div class="stat-bars">
                        <div class="stat-bar home" style="width: 50%">50%</div>
                        <div class="stat-bar away" style="width: 50%">50%</div>
                      </div>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">شوت‌ها</span>
                      <div class="stat-bars">
                        <div class="stat-bar home" style="width: 0%">0</div>
                        <div class="stat-bar away" style="width: 0%">0</div>
                      </div>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">شوت‌های در چارچوب</span>
                      <div class="stat-bars">
                        <div class="stat-bar home" style="width: 0%">0</div>
                        <div class="stat-bar away" style="width: 0%">0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="match-list">
          <!-- Main Filter Tabs (Like Sofascore) -->
          <div class="main-filter-tabs">
            <div class="filter-tab active" data-filter="all">
              <span class="tab-text">همه</span>
            </div>
            <div class="filter-tab" data-filter="live">
              <span class="tab-text">زنده</span>
              <span class="live-count" id="live-count">0</span>
            </div>
            <div class="filter-tab" data-filter="finished">
              <span class="tab-text">تموم شده</span>
            </div>
            <div class="filter-tab" data-filter="upcoming">
              <span class="tab-text">شروع نشده</span>
            </div>
          </div>

          <!-- Filter Items -->
          <div class="filter-items">
            <select class="filter-item region">
              <option value="">کشور/قاره</option>
              <option value="iran">ایران</option>
              <option value="england">انگلیس</option>
              <option value="spain">اسپانیا</option>
              <option value="italy">ایتالیا</option>
              <option value="germany">آلمان</option>
              <option value="france">فرانسه</option>
            </select>
            <a href="#" class="filter-item favorite">
              <i class="icon fa fa-star-o"></i>
              <span class="text">مسابقات من</span>
            </a>
            <a href="#" class="filter-item live">
              <i class="icon fa fa-clock-o"></i>
              <span class="text">نتایج زنده</span>
            </a>
            <a href="#" class="filter-item details" id="show-details-sidebar">
              <i class="icon fa fa-info-circle"></i>
              <span class="text">جزئیات بازی</span>
            </a>
          </div>

          <!-- Notifications Box -->
          <div class="notifications-box">
            <span class="selector"></span>
            <!-- Notifications will be loaded dynamically -->
          </div>

          <!-- Response Result -->
          <div class="response-result hidden">
            <div class="no-results hidden">
              <div class="text">موردی برای نمایش یافت نشد.</div>
              <a href="#reset" class="button error-button">نمایش تمام مسابقات</a>
            </div>
            <img class="spinner initial loading" src="https://footba11.co/assets/images/spinner.gif" alt="loading...">
          </div>

          <!-- Match List Container -->
          <div id="match_list">
            <!-- Matches will be loaded dynamically -->
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="livescore-right-box">
          <!-- League Details Section (replaces modal) -->
          <div class="league-details-section box-shadow" id="league-details-section" style="display: none;">
            <div class="matches-title">
              <span>جزئیات لیگ</span>
              <a href="#" class="close-league-details">&times;</a>
            </div>
            
            <div class="league-details-content">
              <!-- League Header -->
              <div class="league-header">
                <div class="league-info">
                  <img class="league-logo" id="sidebar-league-logo" src="" alt="League Logo">
                  <div class="league-details">
                    <h3 id="sidebar-league-name">نام لیگ</h3>
                    <p id="sidebar-league-country">کشور</p>
                    <p id="sidebar-league-type">نوع</p>
                  </div>
                </div>
                <div class="league-actions">
                  <select id="sidebar-season-selector" class="season-selector">
                    <!-- Seasons will be loaded dynamically -->
                  </select>
                </div>
              </div>

              <!-- League Navigation Tabs -->
              <div class="league-nav-tabs">
                <ul class="tab-list">
                  <li class="active"><a href="#league-overview">نمای کلی</a></li>
                  <li><a href="#league-standings">جدول</a></li>
                  <li><a href="#league-teams">تیم‌ها</a></li>
                  <li><a href="#league-fixtures">مسابقات</a></li>
                  <li><a href="#league-stats">آمار</a></li>
                </ul>
              </div>

              <!-- Tab Content -->
              <div class="tab-content active" id="league-overview">
                <div class="info-section">
                  <h4>اطلاعات فصل</h4>
                  <ul class="info-list">
                    <li><span class="info-label">تورنمنت:</span> <span class="info-value" id="sidebar-tournament">-</span></li>
                    <li><span class="info-label">فصل:</span> <span class="info-value" id="sidebar-season">-</span></li>
                    <li><span class="info-label">مرحله:</span> <span class="info-value" id="sidebar-stage">-</span></li>
                    <li><span class="info-label">شروع:</span> <span class="info-value" id="sidebar-start">-</span></li>
                    <li><span class="info-label">وضعیت:</span> <span class="info-value" id="sidebar-status">-</span></li>
                  </ul>
                </div>
                <div class="stats-section">
                  <h4>آمار کلی</h4>
                  <div id="sidebar-league-stats">آمار در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="league-standings">
                <div class="standings-section">
                  <h4>جدول رده‌بندی</h4>
                  <div id="sidebar-standings-table">جدول در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="league-teams">
                <div class="teams-section">
                  <h4>تیم‌های لیگ</h4>
                  <div id="sidebar-teams-grid">تیم‌ها در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="league-fixtures">
                <div class="fixtures-section">
                  <h4>مسابقات</h4>
                  <div id="sidebar-fixtures-list">مسابقات در حال بارگذاری...</div>
                </div>
              </div>

              <div class="tab-content" id="league-stats">
                <div class="stats-section">
                  <h4>آمار بازیکنان</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <h5>آقای گل</h5>
                      <div id="sidebar-top-scorers">در حال بارگذاری...</div>
                    </div>
                    <div class="stat-item">
                      <h5>پاس‌گل</h5>
                      <div id="sidebar-top-assists">در حال بارگذاری...</div>
                    </div>
                    <div class="stat-item">
                      <h5>کارت‌ها</h5>
                      <div id="sidebar-top-cards">در حال بارگذاری...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Match Details Sidebar (existing) -->
          <div class="match-details-sidebar" id="match-details-sidebar">
            <div class="match-details-container box-shadow">
              <div class="matches-title">
                <span>جزئیات بازی</span>
                <a href="#" class="close-details">&times;</a>
              </div>
              <div class="match-details-content">
                <!-- Match Header -->
                <div class="match-header">
                  <div class="match-teams">
                    <div class="home-team">
                      <img class="team-logo" src="" alt="تیم میزبان">
                      <span class="team-name">تیم میزبان</span>
                    </div>
                    <div class="match-score">
                      <span class="score">0 - 0</span>
                      <span class="match-time">19:00</span>
                    </div>
                    <div class="away-team">
                      <img class="team-logo" src="" alt="تیم میهمان">
                      <span class="team-name">تیم میهمان</span>
                    </div>
                  </div>
                </div>

                <!-- Match Navigation Tabs -->
                <div class="match-nav-tabs">
                  <ul class="tab-list">
                    <li class="active"><a href="#match-info">اطلاعات</a></li>
                    <li><a href="#match-events">رویدادها</a></li>
                    <li><a href="#match-lineups">ترکیب</a></li>
                    <li><a href="#match-teams">تیم‌ها و بازیکنان</a></li>
                    <li><a href="#match-stats">آمار</a></li>
                  </ul>
                </div>

                <!-- Tab Content -->
                <div class="tab-content active" id="match-info">
                  <div class="info-section">
                    <h4>اطلاعات مسابقه</h4>
                    <ul class="info-list">
                      <li><span class="info-label">تورنمنت:</span> <span class="info-value">-</span></li>
                      <li><span class="info-label">فصل:</span> <span class="info-value">-</span></li>
                      <li><span class="info-label">مرحله:</span> <span class="info-value">-</span></li>
                      <li><span class="info-label">شروع:</span> <span class="info-value">-</span></li>
                      <li><span class="info-label">وضعیت:</span> <span class="info-value">-</span></li>
                    </ul>
                  </div>
                </div>

                <div class="tab-content" id="match-events">
                  <div class="events-section">
                    <h4>رویدادهای بازی</h4>
                    <div class="events-timeline">
                      <div class="no-events">هنوز رویدادی ثبت نشده</div>
                    </div>
                  </div>
                </div>

                <div class="tab-content" id="match-lineups">
                  <div class="lineups-section">
                    <h4>ترکیب تیم‌ها</h4>
                    <div class="lineups-container">
                      <!-- Home Team Lineup -->
                      <div class="home-lineup">
                        <h5>تیم میزبان</h5>
                        <div class="football-field">
                          <div class="formation-info">ترکیب: 4-4-2</div>
                          <div class="field" id="home-field">
                            <!-- Players will be positioned here dynamically -->
                          </div>
                        </div>
                        <div class="lineup-players">
                          <div class="no-lineup">ترکیب هنوز اعلام نشده</div>
                        </div>
                      </div>
                      
                      <!-- Away Team Lineup -->
                      <div class="away-lineup">
                        <h5>تیم میهمان</h5>
                        <div class="football-field">
                          <div class="formation-info">ترکیب: 4-4-2</div>
                          <div class="field" id="away-field">
                            <!-- Players will be positioned here dynamically -->
                          </div>
                        </div>
                        <div class="lineup-players">
                          <div class="no-lineup">ترکیب هنوز اعلام نشده</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tab-content" id="match-teams">
                  <div class="teams-section">
                    <h4>تیم‌ها و بازیکنان</h4>
                    <div class="teams-container">
                      <div class="home-team-players">
                        <h5>تیم میزبان</h5>
                        <div class="team-players">
                          <div class="no-players">اطلاعات بازیکنان در حال بارگذاری...</div>
                        </div>
                      </div>
                      <div class="away-team-players">
                        <h5>تیم میهمان</h5>
                        <div class="team-players">
                          <div class="no-players">اطلاعات بازیکنان در حال بارگذاری...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tab-content" id="match-stats">
                  <div class="stats-section">
                    <h4>آمار بازی</h4>
                    <div class="stats-container">
                      <div class="stat-row">
                        <span class="stat-label">مالکیت توپ</span>
                        <div class="stat-bars">
                          <div class="stat-bar home" style="width: 50%">50%</div>
                          <div class="stat-bar away" style="width: 50%">50%</div>
                        </div>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">شوت‌ها</span>
                        <div class="stat-bars">
                          <div class="stat-bar home" style="width: 0%">0</div>
                          <div class="stat-bar away" style="width: 0%">0</div>
                        </div>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">شوت‌های در چارچوب</span>
                        <div class="stat-bars">
                          <div class="stat-bar home" style="width: 0%">0</div>
                          <div class="stat-bar away" style="width: 0%">0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Persian Calendar -->
          <div class="persian-calendar box-shadow">
            <div class="calendar-header">
              <h3>تقویم شمسی</h3>
              <div class="calendar-nav">
                <button class="calendar-btn prev-month">&lt;</button>
                <span class="current-month">شهریور ۱۴۰۴</span>
                <button class="calendar-btn next-month">&gt;</button>
              </div>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <span>ش</span><span>ی</span><span>د</span><span>س</span>
                <span>چ</span><span>پ</span><span>ج</span>
              </div>
              <div class="calendar-days" id="calendar-days">
                <!-- Calendar days will be generated dynamically -->
              </div>
            </div>
            <div class="calendar-footer">
              <button class="today-btn">امروز</button>
            </div>
          </div>

          <!-- Top Leagues -->
          <div class="top-leagues box-shadow">
            <div class="matches-title">لیگ‌های برتر</div>
            <div class="leagues-list" id="top-leagues-list">
              <!-- Top leagues will be loaded dynamically -->
            </div>
          </div>

          <!-- Countries -->
          <div class="countries-section box-shadow">
            <div class="matches-title">کشورها</div>
            <div class="countries-list" id="countries-list">
              <!-- Countries will be loaded dynamically -->
            </div>
          </div>
        </div>
      </div>

     

      <!-- Mobile Bottom Tabs -->
      <div class="bottom-tab-list">
        <a href="#" class="bottom-tab active">
          <i class="icomoon icon-matches"></i>
          <span>مسابقات</span>
        </a>
        <a href="#" class="bottom-tab">
          <i class="icomoon icon-news"></i>
          <span>اخبار</span>
        </a>
        <a href="#" class="bottom-tab">
          <i class="icomoon icon-tournaments"></i>
          <span>لیگ‌ها</span>
        </a>
        <a href="#" class="bottom-tab app-tab">
          <i class="fa fa-android"></i>
          <span>اپلیکیشن</span>
        </a>
      </div>

      <!-- Mobile Drawer -->
      <div class="drawer-container">
        <div class="topbar">
          <span>فوتبــال 11</span>
          <span class="close-button fa fa-times-thin"></span>
        </div>
        <div class="drawer-content">
          <div id="user_info" class="user-info">
            <img class="user-avatar initial loading" src="https://static.footba11.net/images/placeholders/user.jpg">
            <div class="user-name"></div>
            <div class="buttons">
              <a class="button button-login" href="#">
                <i class="fa fa-sign-in"></i>ورود
              </a>
              <a class="button button-register" href="#">
                <i class="fa fa-user-o"></i>ثبت نام
              </a>
            </div>
          </div>
          <div class="links">
            <a class="link" href="#">
              <i class="icon icomoon icon-matches"></i>
              <span>مسابقات</span>
            </a>
            <a class="link" href="#">
              <i class="icon icomoon icon-news"></i>
              <span>اخبار</span>
            </a>
            <a class="link" href="#">
              <i class="icon icomoon icon-tournaments"></i>
              <span>لیگ‌ها</span>
            </a>
            <a class="link" href="#">
              <i class="icon fa fa-envelope"></i>
              <span>تماس با ما</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading and Overlay Elements -->
    <div class="fixed-loading" style="display: none;">در حال بارگذاری...</div>
    <div class="body-overlay" style="display: none;"></div>

    <script>
      // Initialize the app when DOM is ready
      jQuery(document).ready(function($) {
        // Wait a bit for Football11App to be available
        setTimeout(function() {
          if (typeof window.Football11App !== 'undefined') {
            console.log('✅ Football11App loaded, initializing...');
            // Initialize the app - these functions will be called from initEvents
            window.Football11App.init();
          } else {
            console.error('❌ Football11App not found');
          }
        }, 500);
      });
    </script>
    <?php return ob_get_clean();
  }
}

new Football11_Final_Plugin();