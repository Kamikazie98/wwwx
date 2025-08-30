(function($) {
    'use strict';

    if (!window.Football11App) {
        window.Football11App = {};
    }

    window.Football11App.api = {
        init: function(app) {
            this.app = app;
        },

        fetchAPI: function(endpoint, params = {}, isLive = false) {
            const urlParams = new URLSearchParams(params).toString();
            const url = `${this.app.config.api.base}/${endpoint}?${urlParams}`;

            // Check for API key before fetching
            if (!this.app.config.api.key) {
                const errorMsg = 'کلید API تنظیم نشده است. لطفاً از بخش تنظیمات افزونه، کلید خود را وارد کنید.';
                // Use a Promise to keep the return type consistent
                return Promise.reject(new Error(errorMsg));
            }

            return fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': this.app.config.api.key,
                    'x-rapidapi-host': this.app.config.api.host
                }
            })
            .then(response => {
                if (!response.ok) {
                    // Create a detailed error message
                    return response.text().then(text => {
                        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                // The API sometimes returns errors in the body with a 200 status
                if (data.errors && Object.keys(data.errors).length > 0) {
                    // Extract a meaningful error message if possible
                    const errorDetail = Object.values(data.errors).join(', ');
                    throw new Error(`API Error: ${errorDetail}`);
                }
                return data.response;
            });
            // Removed the .catch block here to allow the caller to handle it.
        },

        fetchFixturesWithPagination: function(params, maxPages = null) {
            const config = this.app.config.pagination;
            maxPages = maxPages || config.maxPages;

            if (maxPages === 1) {
                const pageParams = { ...params, page: 1 };
                return this.fetchAPI('fixtures', pageParams, false);
            }

            const allFixtures = [];
            let currentPage = 1;
            const maxResults = maxPages * config.maxResultsPerPage;

            const fetchPage = (page) => {
                const pageParams = { ...params, page };
                const delay = page > 1 ? config.delayBetweenPages : 0;

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.fetchAPI('fixtures', pageParams, false)
                            .then(fixtures => {
                                if (fixtures && fixtures.length > 0) {
                                    allFixtures.push(...fixtures);
                                    if (fixtures.length === config.maxResultsPerPage && currentPage < maxPages && allFixtures.length < maxResults) {
                                        currentPage++;
                                        resolve(fetchPage(currentPage));
                                    } else {
                                        resolve(allFixtures);
                                    }
                                } else {
                                    resolve(allFixtures);
                                }
                            })
                            .catch(error => {
                                // On error, we reject the whole pagination process
                                console.error(`Error fetching page ${page}:`, error);
                                reject(error);
                            });
                    }, delay);
                });
            };
            return fetchPage(currentPage);
        }
    };

})(jQuery);
