/**
 * Football11 Final - Admin JavaScript
 * مدیریت ترجمه‌ها در پنل ادمین
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Translation Manager
    const TranslationManager = {
        translations: {},
        
        init() {
            this.bindEvents();
            this.loadStats();
        },
        
        bindEvents() {
            $('#load-translations').on('click', () => this.loadTranslations());
            $('#export-translations').on('click', () => this.exportTranslations());
            $('#test-file-permissions').on('click', () => this.testFilePermissions());
            $('#add-translation').on('click', () => this.showAddModal());
            $('#cancel-add-translation').on('click', () => this.hideAddModal());
            $('#save-add-translation').on('click', () => this.saveNewTranslation());
            
            // Test server translation
            $('#test-server-translation').on('click', () => this.testServerTranslation());
            
            // Close modal on outside click
            $('#add-translation-modal').on('click', (e) => {
                if (e.target.id === 'add-translation-modal') {
                    this.hideAddModal();
                }
            });
        },
        
        async testServerTranslation() {
            try {
                $('#test-server-translation').prop('disabled', true).text('در حال تست...');
                
                const response = await fetch(F11FINAL_ADMIN.ajax, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'f11_final',
                        op: 'test_server_translation',
                        text: 'Arsenal',
                        category: 'teams',
                        _ajax_nonce: F11FINAL_ADMIN.nonce
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showNotice(`✅ تست سرور ترجمه موفقیت‌آمیز بود!<br>متد: ${data.data.method}<br>ترجمه: Arsenal → ${data.data.result.translation}`, 'success');
                } else {
                    let errorMessage = '❌ تست سرور ترجمه ناموفق بود!';
                    
                    if (data.data && data.data.status) {
                        const status = data.data.status;
                        errorMessage += `<br><br>📊 وضعیت سیستم:`;
                        errorMessage += `<br>• Node.js: ${status.node_available ? '✅ موجود' : '❌ موجود نیست'}`;
                        errorMessage += `<br>• مسیر Node.js: ${status.node_path}`;
                        errorMessage += `<br>• فایل translate-fetch.js: ${status.translate_file_exists ? '✅ موجود' : '❌ موجود نیست'}`;
                        errorMessage += `<br>• مسیر فایل: ${status.translate_file_path}`;
                        
                        if (status.test_result) {
                            errorMessage += `<br>• نتیجه تست: ${JSON.stringify(status.test_result)}`;
                        }
                    }
                    
                    this.showNotice(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error testing server translation:', error);
                this.showNotice('❌ خطا در تست سرور ترجمه: ' + error.message, 'error');
            } finally {
                $('#test-server-translation').prop('disabled', false).text('🔧 تست سرور ترجمه');
            }
        },
        
        async loadTranslations() {
            try {
                $('#load-translations').prop('disabled', true).text('در حال بارگذاری...');
                
                const response = await fetch(F11FINAL_ADMIN.ajax, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'f11_final',
                        op: 'get_local_translations',
                        _ajax_nonce: F11FINAL_ADMIN.nonce
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.translations = data.data;
                    this.displayTranslations();
                    this.updateStats();
                    this.showNotice('ترجمه‌ها با موفقیت بارگذاری شدند.', 'success');
                } else {
                    this.showNotice('خطا در بارگذاری ترجمه‌ها.', 'error');
                }
            } catch (error) {
                console.error('Error loading translations:', error);
                this.showNotice('خطا در بارگذاری ترجمه‌ها.', 'error');
            } finally {
                $('#load-translations').prop('disabled', false).text('بارگذاری ترجمه‌ها');
            }
        },
        
        displayTranslations() {
            const container = $('#translation-table');
            let html = '';
            
            if (Object.keys(this.translations).length === 0) {
                html = '<p>هیچ ترجمه‌ای یافت نشد.</p>';
            } else {
                html = '<table class="wp-list-table widefat fixed striped">';
                html += '<thead><tr>';
                html += '<th>دسته</th>';
                html += '<th>متن اصلی</th>';
                html += '<th>ترجمه فارسی</th>';
                html += '<th>عملیات</th>';
                html += '</tr></thead><tbody>';
                
                Object.entries(this.translations).forEach(([category, items]) => {
                    Object.entries(items).forEach(([original, translation]) => {
                        html += '<tr>';
                        html += `<td>${this.getCategoryName(category)}</td>`;
                        html += `<td>${this.escapeHtml(original)}</td>`;
                        html += `<td>${this.escapeHtml(translation)}</td>`;
                        html += `<td>
                            <button class="button button-small edit-translation" 
                                    data-category="${category}" 
                                    data-original="${this.escapeHtml(original)}" 
                                    data-translation="${this.escapeHtml(translation)}">
                                ویرایش
                            </button>
                            <button class="button button-small button-link-delete delete-translation" 
                                    data-category="${category}" 
                                    data-original="${this.escapeHtml(original)}">
                                حذف
                            </button>
                        </td>`;
                        html += '</tr>';
                    });
                });
                
                html += '</tbody></table>';
            }
            
            container.html(html);
            
            // Bind edit and delete events
            this.bindTableEvents();
        },
        
        bindTableEvents() {
            $('.edit-translation').on('click', (e) => {
                const btn = $(e.target);
                const category = btn.data('category');
                const original = btn.data('original');
                const translation = btn.data('translation');
                
                this.showEditModal(category, original, translation);
            });
            
            $('.delete-translation').on('click', (e) => {
                const btn = $(e.target);
                const category = btn.data('category');
                const original = btn.data('original');
                
                if (confirm(`آیا از حذف ترجمه "${original}" اطمینان دارید؟`)) {
                    this.deleteTranslation(category, original);
                }
            });
        },
        
        showEditModal(category, original, translation) {
            $('#translation-category').val(category);
            $('#translation-original').val(original);
            $('#translation-farsi').val(translation);
            $('#translation-original').prop('readonly', true);
            $('#add-translation-modal h3').text('ویرایش ترجمه');
            $('#add-translation-modal').show();
        },
        
        showAddModal() {
            $('#translation-category').val('teams');
            $('#translation-original').val('').prop('readonly', false);
            $('#translation-farsi').val('');
            $('#add-translation-modal h3').text('افزودن ترجمه جدید');
            $('#add-translation-modal').show();
        },
        
        hideAddModal() {
            $('#add-translation-modal').hide();
            $('#translation-original').val('').prop('readonly', false);
            $('#translation-farsi').val('');
        },
        
        async saveNewTranslation() {
            const category = $('#translation-category').val();
            const original = $('#translation-original').val().trim();
            const translation = $('#translation-farsi').val().trim();
            
            if (!original || !translation) {
                this.showNotice('لطفاً تمام فیلدها را پر کنید.', 'error');
                return;
            }
            
            try {
                const isEdit = $('#translation-original').prop('readonly');
                const operation = isEdit ? 'update_translation' : 'save_local_translation';
                
                const response = await fetch(F11FINAL_ADMIN.ajax, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'f11_final',
                        op: operation,
                        original_text: original,
                        translation: translation,
                        category: category,
                        _ajax_nonce: F11FINAL_ADMIN.nonce
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showNotice(
                        isEdit ? 'ترجمه با موفقیت به‌روزرسانی شد.' : 'ترجمه جدید با موفقیت ذخیره شد.', 
                        'success'
                    );
                    this.hideAddModal();
                    this.loadTranslations(); // Reload to show changes
                } else {
                    this.showNotice('خطا در ذخیره ترجمه.', 'error');
                }
            } catch (error) {
                console.error('Error saving translation:', error);
                this.showNotice('خطا در ذخیره ترجمه.', 'error');
            }
        },
        
        async deleteTranslation(category, original) {
            try {
                const response = await fetch(F11FINAL_ADMIN.ajax, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'f11_final',
                        op: 'delete_translation',
                        original_text: original,
                        category: category,
                        _ajax_nonce: F11FINAL_ADMIN.nonce
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showNotice('ترجمه با موفقیت حذف شد.', 'success');
                    this.loadTranslations(); // Reload to show changes
                } else {
                    this.showNotice('خطا در حذف ترجمه.', 'error');
                }
            } catch (error) {
                console.error('Error deleting translation:', error);
                this.showNotice('خطا در حذف ترجمه.', 'error');
            }
        },
        
        async exportTranslations() {
            try {
                const exportData = {
                    translations: this.translations,
                    export_date: new Date().toISOString(),
                    version: '1.0'
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `translations-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotice('ترجمه‌ها با موفقیت صادر شدند.', 'success');
            } catch (error) {
                console.error('Error exporting translations:', error);
                this.showNotice('خطا در صادرات ترجمه‌ها.', 'error');
            }
        },
        
        async testFilePermissions() {
            try {
                $('#test-file-permissions').prop('disabled', true).text('در حال تست...');
                
                const response = await fetch(F11FINAL_ADMIN.ajax, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'f11_final',
                        op: 'test_translation_file',
                        _ajax_nonce: F11FINAL_ADMIN.nonce
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showFileTestResults(data.data);
                } else {
                    this.showNotice('خطا در تست فایل.', 'error');
                }
            } catch (error) {
                console.error('Error testing file permissions:', error);
                this.showNotice('خطا در تست فایل.', 'error');
            } finally {
                $('#test-file-permissions').prop('disabled', false).text('تست مجوزهای فایل');
            }
        },
        
        showFileTestResults(results) {
            const modal = $(`
                <div id="file-test-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10001;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; min-width: 500px; max-height: 80vh; overflow-y: auto;">
                        <h3>نتایج تست فایل</h3>
                        <table class="wp-list-table widefat">
                            <tbody>
                                <tr><td><strong>مسیر فایل:</strong></td><td>${results.file_path}</td></tr>
                                <tr><td><strong>فایل وجود دارد:</strong></td><td>${results.file_exists ? 'بله' : 'خیر'}</td></tr>
                                <tr><td><strong>قابل خواندن:</strong></td><td>${results.file_readable ? 'بله' : 'خیر'}</td></tr>
                                <tr><td><strong>قابل نوشتن:</strong></td><td>${results.file_writable ? 'بله' : 'خیر'}</td></tr>
                                <tr><td><strong>پوشه قابل نوشتن:</strong></td><td>${results.directory_writable ? 'بله' : 'خیر'}</td></tr>
                                <tr><td><strong>اندازه فایل:</strong></td><td>${results.file_size}</td></tr>
                                <tr><td><strong>مجوزهای فایل:</strong></td><td>${results.file_permissions}</td></tr>
                                <tr><td><strong>مجوزهای پوشه:</strong></td><td>${results.directory_permissions}</td></tr>
                                <tr><td><strong>کاربر PHP:</strong></td><td>${results.php_user}</td></tr>
                                <tr><td><strong>تست نوشتن:</strong></td><td>${results.write_test}</td></tr>
                            </tbody>
                        </table>
                        <div style="text-align: center; margin-top: 20px;">
                            <button type="button" class="button button-primary" onclick="jQuery('#file-test-modal').remove()">بستن</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(modal);
            modal.show();
        },
        
        updateStats() {
            const stats = this.calculateStats();
            $('#total-translations').text(stats.total);
            $('#teams-count').text(stats.teams);
            $('#players-count').text(stats.players);
            $('#countries-count').text(stats.countries);
        },
        
        calculateStats() {
            const stats = { total: 0, teams: 0, players: 0, countries: 0 };
            
            if (this.translations.teams) stats.teams = Object.keys(this.translations.teams).length;
            if (this.translations.players) stats.players = Object.keys(this.translations.players).length;
            if (this.translations.countries) stats.countries = Object.keys(this.translations.countries).length;
            
            stats.total = stats.teams + stats.players + stats.countries;
            return stats;
        },
        
        loadStats() {
            this.updateStats();
        },
        
        getCategoryName(category) {
            const names = {
                'teams': 'تیم‌ها',
                'players': 'بازیکنان',
                'countries': 'کشورها'
            };
            return names[category] || category;
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        showNotice(message, type = 'info') {
            const noticeClass = type === 'error' ? 'notice-error' : 'notice-success';
            const notice = $(`
                <div class="notice ${noticeClass} is-dismissible">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">بستن این اعلان.</span>
                    </button>
                </div>
            `);
            
            $('.wrap h1').after(notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                notice.fadeOut();
            }, 5000);
        }
    };
    
    // Initialize Translation Manager
    TranslationManager.init();
});
