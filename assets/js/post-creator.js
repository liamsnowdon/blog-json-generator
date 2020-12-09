(function () {
    var STORAGE = {
        SAVED_FOR_LATER_POSTS: 'savedForLaterPosts'
    };

    var PostCreator = {
        /**
         * Initialises the page.
         */
        initialise: function () {
            this.initViewElements();

            this.datePostedPicker = new Pikaday({ 
                field: this.datePosted
            });

            this.setSavedForLaterChoices();

            // Set default author... Meeeee :)
            this.author.value = 'Liam Snowdon';

            this.initTinymce();
            this.initChoicesSelects();

            this.connectEvents();
        },

        initViewElements: function () {
            this.loadJsonForm = document.querySelector('.js-load-json-form');
            this.json = this.loadJsonForm.querySelector('.js-json');

            this.savedForLaterForm = document.querySelector('.js-saved-for-later-form');
            this.savedForLater = this.savedForLaterForm.querySelector('.js-saved-for-later');
            this.deletedSavedForLater = this.savedForLaterForm.querySelector('.js-delete-saved-for-later');

            this.editPostSection = document.getElementById('edit-post');
            this.createPostSection = document.getElementById('create-post');

            this.form = document.querySelector('.js-post-creator-form');
            this.id = this.form.querySelector('.js-id');
            this.file = this.form.querySelector('.js-file');
            this.imageUrl = this.form.querySelector('.js-image-url');
            this.author = this.form.querySelector('.js-author');
            this.title = this.form.querySelector('.js-title');
            this.intro = this.form.querySelector('.js-intro');
            this.datePosted = this.form.querySelector('.js-date-posted');
            this.category = this.form.querySelector('.js-category');
            this.tags = this.form.querySelector('.js-tags');
            this.relatedPosts = this.form.querySelector('.js-related-posts');
            this.content = this.form.querySelector('.js-content');

            this.saveForLater = document.querySelector('.js-save-for-later');
        },

        /**
         * Initialises the tinyMCE editor for the content textarea
         */
        initTinymce: function () {
            tinymce.PluginManager.add('inlinecode', function (editor, url) {
                editor.ui.registry.addButton('inlinecode', {
                    tooltip: 'Insert inline code sample',
                    icon: 'sourcecode',
                    onAction: function () {
                        var selection = editor.selection.getContent();

                        editor.insertContent('<code class="b-inline-code">' + selection + '</code>');
                    }
                });
            });

            tinymce.init({
                selector: '#content',
                height: 500,
                plugins: 'codesample inlinecode lists link image',
                toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | link | bullist numlist outdent indent | codesample inlinecode | image | removeformat',
                menubar: false,
                image_dimensions: false,
                image_prepend_url: '/assets/images/posts/'
            });
        },

        initChoices: function () {
            this.categoryChoices = createChoiceOptions(window.BlogGenerator.Categories);
            this.tagsChoices = createChoiceOptions(window.BlogGenerator.Tags);
            this.relatedPostsChoices = createChoiceOptions(window.BlogGenerator.Posts);

            function createChoiceOptions (data) {
                return data.map(function (item, index) {
                   return {
                       value: index + 1,
                       label: item
                   };
                });
            }
        },

        /**
         * Initialises the Choices plugin on select boxes
         */
        initChoicesSelects: function () {
            this.initChoices();            

            // Initialises the category Choices select box
            this.categoryChoicesSelect = new Choices('#category', {
                searchEnabled: false,
                choices: this.categoryChoices
            });

            // Initialises the tags Choices multiselect box
            this.tagsChoicesSelect = new Choices('#tags', {
                removeItemButton: true,
                placeholderValue: 'Add tags',
                choices: this.tagsChoices
            });

            this.relatedPostsChoicesSelect = new Choices('#related-posts', {
                removeItemButton: true,
                placeholderValue: 'Add related post',
                choices: this.relatedPostsChoices
            });

            this.savedForLaterChoicesSelect = new Choices('#saved-for-later', {
                searchEnabled: false,
                choices: this.savedForLaterChoices
            });
        },

        /**
         * Attaches event listeners.
         */
        connectEvents: function () {
            this.form.addEventListener('submit', this.onFormSubmit.bind(this));
            this.loadJsonForm.addEventListener('submit', this.onLoadJsonFormSubmit.bind(this));
            this.savedForLaterForm.addEventListener('submit', this.onSavedForLaterFormSubmit.bind(this));
            this.saveForLater.addEventListener('click', this.onSaveForLater.bind(this));
            this.deletedSavedForLater.addEventListener('click', this.onDeleteSavedFormLater.bind(this));
        },

        /**
         * Copies the post JSON data to the clipboard
         * 
         * @param event 
         */
        onFormSubmit: function (event) {
            event.preventDefault();

            tinymce.triggerSave();

            var data = JSON.stringify(this.getDataFromForm());

            navigator.clipboard.writeText(data)
                .then(function () {
                    alert('JSON copied to clipboard.');
                }, function () {
                    alert('Error copying JSON to clipboard.');
                });
        },

        /**
         * Takes JSON as user input and fills out the form from it.
         * 
         * @param event 
         */
        onLoadJsonFormSubmit: function (event) {
            event.preventDefault();

            var jsonData = this.json.value;

            if (!jsonData) {
                return;
            }

            try {
                jsonData = JSON.parse(jsonData);
                this.json.value = null;
            } catch (e) {
                alert('Error loading post data from JSON. Check console.');
                console.error(e);
                return;
            }

            this.fillFormFromPostData(jsonData);
            this.scrollToForm();
        },

        /**
         * Fills out form from a post object
         * 
         * @param {Object} post 
         */
        fillFormFromPostData: function (post) {
            this.resetForm();

            this.id.value = post.id | null;
            this.file.value = post.file || null;
            this.imageUrl.value = post.imageUrl || null;
            this.author.value = post.author || null;
            this.title.value = post.title || null;
            this.intro.value = post.intro || null;
            
            if (post.content) {
                tinymce.editors.content.setContent(post.content)
            }

            if (post.datePosted) {
                this.datePostedPicker.setDate(post.datePosted);
            }
            
            if (typeof post.category !== 'undefined') {
                this.categoryChoicesSelect.setChoiceByValue(post.category);
            }

            if (post.tags && post.tags.length > 0) {
                this.tagsChoicesSelect.setChoiceByValue(post.tags);
            }
            
            if (post.relatedPosts && post.relatedPosts.length > 0) {
                this.relatedPostsChoicesSelect.setChoiceByValue(post.relatedPosts);
            }
        },

        /**
         * Gets post data from the form
         */
        getDataFromForm: function () {
            return {
                id: this.id ? Number(this.id.value) : null,
                file: this.file ? this.file.value: null,
                imageUrl: this.imageUrl ? this.imageUrl.value : null,
                author: this.author ? this.author.value : null,
            
                title: this.title.value,
                intro: this.intro.value,
                datePosted: this.datePosted ? new Date(this.datePosted.value).toISOString() : null,
                category: Number(this.category.value),
                tags: Array.from(this.tags.selectedOptions).map(function (option) {
                    return Number(option.value);
                }),
                relatedPosts: Array.from(this.relatedPosts.selectedOptions).map(function (option) {
                    return Number(option.value);
                }),

                content: this.content.value
            };
        },

        /**
         * Reset form to initial state
         */
        resetForm: function () {
            this.id.value = null;
            this.file.value = null;
            this.imageUrl.value = null;
            this.author.value = null;
            this.title.value = null;
            this.intro.value = null;

            tinymce.editors.content.resetContent();
            this.datePostedPicker.clear();
            this.categoryChoicesSelect.removeActiveItems();
            this.tagsChoicesSelect.removeActiveItems();
            this.relatedPostsChoicesSelect.removeActiveItems();
        },

        scrollToForm: function () {
            this.createPostSection.scrollIntoView();
        },

        /**
         * --------------
         * SAVE FOR LATER
         * --------------
         */

        getSavedForLaterPosts: function () {
            return JSON.parse(localStorage.getItem(STORAGE.SAVED_FOR_LATER_POSTS));
        },

        setSavedForLaterPosts: function (posts) {
            localStorage.setItem(STORAGE.SAVED_FOR_LATER_POSTS, JSON.stringify(posts));
        },

        setSavedForLaterChoices: function () {
            var savedForLaterPosts = this.getSavedForLaterPosts();

            this.savedForLaterChoices = savedForLaterPosts.map(function (post, index) {
                return {
                    value: index,
                    label: post.title
                };
            });
        },

        onSavedForLaterFormSubmit: function (event) {
            event.preventDefault();

            var savedForLaterPosts = this.getSavedForLaterPosts();
            var post = savedForLaterPosts[Number(this.savedForLater.value)];

            this.fillFormFromPostData(post);
            this.scrollToForm();
        },

        onSaveForLater: function () {
            tinymce.triggerSave();

            var data = this.getDataFromForm();
            var currentSavedForLaterPosts = JSON.parse(localStorage.getItem(STORAGE.SAVED_FOR_LATER_POSTS));

            if (!currentSavedForLaterPosts) {
                currentSavedForLaterPosts = [];
            }

            currentSavedForLaterPosts.push(data);

            this.setSavedForLaterPosts(currentSavedForLaterPosts);

            alert('Post saved for later.');
            
            this.resetForm();
            this.setSavedForLaterChoices();
            
            this.savedForLaterChoicesSelect.removeActiveItems();
            this.savedForLaterChoicesSelect.setChoices(this.savedForLaterChoices, 'value', 'label', true);
        },

        onDeleteSavedFormLater: function () {
            if (this.savedForLater.value === '') {
                return;
            }

            var postIndex = Number(this.savedForLater.value);
            var savedForLaterPosts = this.getSavedForLaterPosts();

            savedForLaterPosts.splice(postIndex, 1);

            this.setSavedForLaterPosts(savedForLaterPosts);
            this.setSavedForLaterChoices();
            
            this.savedForLaterChoicesSelect.removeActiveItems();
            this.savedForLaterChoicesSelect.setChoices(this.savedForLaterChoices, 'value', 'label', true);
        },
    };

    window.BlogGenerator = window.BlogGenerator || {};
    window.BlogGenerator.PostCreator = PostCreator;
})();

window.BlogGenerator.PostCreator.initialise();