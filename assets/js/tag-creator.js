(function () {
    var TagCreator = {
        /**
         * Initialises the page.
         * 
         * @param {Object} njkData - Nunjucks data
         * @param {Array} njkData.newTagId
         */
        initialise: function (njkData) {
            this.form = document.querySelector('.js-tag-creator-form');
            
            this.id = this.form.querySelector('.js-id');
            this.file = this.form.querySelector('.js-file');
            this.imageUrl = this.form.querySelector('.js-image-url');

            this.name = this.form.querySelector('.js-name');
            this.intro = this.form.querySelector('.js-intro');

            this.connectEvents();
        },

        /**
         * Attaches event listeners.
         */
        connectEvents: function () {
            this.form.addEventListener('submit', this.onFormSubmit.bind(this));
        },

        /**
         * Submits the form.
         * 
         * @param event 
         */
        onFormSubmit: function (event) {
            event.preventDefault();

            var data = JSON.stringify({
                id: this.id ? Number(this.id.value) : null,
                file: this.file ? this.file.value: null,
                imageUrl: this.imageUrl ? this.imageUrl.value : null,
            
                name: this.name.value,
                intro: this.intro.value
            });

            navigator.clipboard.writeText(data)
                .then(function () {
                    alert('JSON copied to clipboard.');
                }, function () {
                    alert('Error copying JSON to clipboard.');
                });
        }
    };

    window.BlogGenerator = window.BlogGenerator || {};
    window.BlogGenerator.TagCreator = TagCreator;
})();

window.BlogGenerator.TagCreator.initialise();