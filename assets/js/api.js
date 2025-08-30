// assets/js/api.js

window.Football11Api = {
  fetchAPI: function(endpoint, params = {}, isLive = false) {
    const config = window.Football11App.config;
    const urlParams = new URLSearchParams(params).toString();
    const url = `${config.api.base}/${endpoint}?${urlParams}`;

    return fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': config.api.key,
        'x-rapidapi-host': config.api.host
      }
    })
    .then(response => {
      if (!response.ok) {
        return Promise.reject(`Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.errors && Object.keys(data.errors).length) {
        throw new Error(JSON.stringify(data.errors));
      }
      return data.response;
    })
    .catch(error => {
      console.error('API Error:', error);
      return [];
    });
  },

  fetchFixturesWithPagination: function(params, maxPages = null) {
    const config = window.Football11App.config.pagination;
    maxPages = maxPages || config.maxPages;

    const allFixtures = [];
    let currentPage = 1;

    const fetchPage = (page) => {
      const pageParams = { ...params, page };
      const delay = page > 1 ? config.delayBetweenPages : 0;

      return new Promise(resolve => {
        setTimeout(() => {
          this.fetchAPI('fixtures', pageParams, false)
            .then(fixtures => {
              if (fixtures && fixtures.length > 0) {
                allFixtures.push(...fixtures);

                if (fixtures.length === config.maxResultsPerPage && currentPage < maxPages) {
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
              console.error(`Error fetching page ${page}:`, error);
              resolve(allFixtures);
            });
        }, delay);
      });
    };

    return fetchPage(currentPage);
  },
};
