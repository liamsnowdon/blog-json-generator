(function () {
    var STORAGE = {
        SAVED_FOR_LATER_POSTS: 'savedForLaterPosts'
    };

    var CATEGORIES = [
        'HTML',
        'CSS',
        'JavaScript',
        'General'
      ];

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
            this.initChoices();         
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
            this.ogImageUrl = this.form.querySelector('.js-og-image-url');
            this.thumbnailImageUrl = this.form.querySelector('.js-thumbnail-image-url');
            this.headerImageUrl = this.form.querySelector('.js-header-image-url');
            this.author = this.form.querySelector('.js-author');
            this.title = this.form.querySelector('.js-title');
            this.intro = this.form.querySelector('.js-intro');
            this.datePosted = this.form.querySelector('.js-date-posted');
            this.category = this.form.querySelector('.js-category');
            this.content = this.form.querySelector('.js-content');

            this.saveForLater = document.querySelector('.js-save');
            this.reset = document.querySelector('.js-reset');
        },

        /**
         * Initialises the tinyMCE editor for the content textarea
         */
        initTinymce: function () {
            var self = this;
            self.canIUseFeatures = [];

            this.getFeatures()
                .then(function () {
                    self.initTinyMcePlugins();
                    self.initTinymceEditor();
                });
        },

        initTinyMcePlugins: function () {
            this.initInlineCodeTinymcePlugin();
            this.initCanIUseTinymcePlugin();
        },

        /**
         * Adds the inline code plugin to tinymce.
         * 
         * Wraps the selection with a tag which is styled to be like inline code.
         * 
         * @todo change so that you can change it back properly like bold functionality
         */
        initInlineCodeTinymcePlugin: function () {
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
        },

        /**
         * Adds the CanIUse plugin to tinymce.
         * 
         * Inserts the HTML from https://caniuse.bitsofco.de/
         * Opens a popup where you can select from the feature list or manually enter the feature
         * for the widget to use.
         * 
         * FYI: The script tag is included in the post page template in the blog repo
         */
        initCanIUseTinymcePlugin: function () {
          var self = this;

          tinymce.PluginManager.add('caniuse', function (editor) {
            var canIUseWidgetTemplate = '' +
                '<div class="ciu_embed" data-feature="<% FEATURE %>" data-periods="future_1,current,past_1,past_2" data-accessible-colours="false">' +
                    '<picture>' +
                        '<source type="image/webp" srcset="https://caniuse.bitsofco.de/image/<% FEATURE %>.webp">' +
                        '<source type="image/png" srcset="https://caniuse.bitsofco.de/image/<% FEATURE %>.png">' +
                        '<img src="https://caniuse.bitsofco.de/image/<% FEATURE %>.jpg" alt="Data on support for the <% FEATURE %> feature across the major browsers from caniuse.com">' +
                    '</picture>' +
                '</p>';
        
            var openDialog = function () {
              return editor.windowManager.open({
                title: 'Add CanIUse Widget',
                body: {
                  type: 'panel',
                  items: [
                    { type: 'selectbox', name: 'selectFeature', label: 'Select a feature', items: self.canIUseFeatures },
                    { type: 'input', name: 'textFeature', label: 'Or manually enter a feature' }
                  ]
                },
                buttons: [
                  { type: 'cancel', text: 'Cancel' },
                  { type: 'submit', text: 'Add', primary: true }
                ],
                onSubmit: function (api) {
                  var data = api.getData();
                  var feature = data.textFeature || data.selectFeature;

                  var widgetHtml = canIUseWidgetTemplate.replace(/<% FEATURE %>/g, feature);
        
                  editor.insertContent(widgetHtml);
                  api.close();
                }
              });
            };
        
            editor.ui.registry.addButton('caniuse', {
                tooltip: 'Insert CanIUse widget',
                icon: 'table',
                onAction: function () {
                    // Open window
                    openDialog();
                }
            });
          });
        },

        /**
         * Initialise the tinymce editor.
         * 
         * Custom plugins: inlinecode, caniuse
         */
        initTinymceEditor: function () {
            tinymce.init({
                selector: '#content',
                height: 500,
                plugins: 'codesample inlinecode caniuse lists link image',
                toolbar: 'undo redo | formatselect | bold italic underline | link blockquote | bullist numlist outdent indent | codesample inlinecode caniuse | image | removeformat',
                menubar: false,
                image_dimensions: false,
                image_prepend_url: '/assets/images/posts/'
            });
        },

        /**
         * Gets the features from CanIUse using the API from the person who created the widget for displaying
         * the data.
         */
        getFeatures: function () {
            var url = 'https://api.caniuse.bitsofco.de/features';
            var self = this;

            return fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw Error(response.statusText);
                    }

                    return response.json()
                })
                .then(function(features) {
                    features = features
                      .filter(function (feature) {
                        return feature.dataSource === 'caniuse';
                      })
                      .map(function (feature) {
                        return {
                            value: feature.id,
                            text: feature.title
                        };
                    });

                    self.canIUseFeatures = features;
                })
                .catch(function (error) {
                    console.error('There was a problem fetching CanIUse features.', error);
                })
                .then(function () {
                  var defaultOption = {
                    value: '',
                    text: !!self.canIUseFeatures.length ? 'Select a feature' : 'No features could be found.'
                  };

                  self.canIUseFeatures.splice(0, 0, defaultOption);
                });
        },

        initChoices: function () {
            this.categoryChoices = CATEGORIES.map(function (category, index) {
                return {
                    value: index + 1,
                    label: category
                };
            });
        },

        /**
         * Initialises the Choices plugin on select boxes
         */
        initChoicesSelects: function () { 
            // Initialises the category Choices select box
            this.categoryChoicesSelect = new Choices('#category', {
                searchEnabled: false,
                choices: this.categoryChoices
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
            this.reset.addEventListener('click', this.onReset.bind(this));
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
            this.ogImageUrl.value = post.ogImageUrl || null;
            this.thumbnailImageUrl.value = post.thumbnailImageUrl || null;
            this.headerImageUrl.value = post.headerImageUrl || null;
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
        },

        /**
         * Gets post data from the form
         */
        getDataFromForm: function () {
            return {
                id: this.id ? Number(this.id.value) : null,
                file: this.file ? this.file.value: null,
                ogImageUrl: this.ogImageUrl ? this.ogImageUrl.value : null,
                thumbnailImageUrl: this.thumbnailImageUrl ? this.thumbnailImageUrl.value : null,
                headerImageUrl: this.headerImageUrl ? this.headerImageUrl.value : null,
                author: this.author ? this.author.value : null,
            
                title: this.title.value,
                intro: this.intro.value,
                datePosted: this.datePosted ? new Date(this.datePosted.value).toISOString() : null,
                category: Number(this.category.value),
                tags: ['TAG_ID', 'TAG_ID'],

                content: this.content.value
            };
        },

        /**
         * Reset form to initial state
         */
        resetForm: function () {
            this.id.value = null;
            this.file.value = null;
            this.ogImageUrl.value = null;
            this.thumbnailImageUrl.value = null;
            this.headerImageUrl.value = null;
            this.author.value = null;
            this.title.value = null;
            this.intro.value = null;

            tinymce.editors.content.resetContent();
            this.datePostedPicker.clear();
            this.categoryChoicesSelect.removeActiveItems();
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
            return JSON.parse(localStorage.getItem(STORAGE.SAVED_FOR_LATER_POSTS)) || [];
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

        onReset: function () {
            this.resetForm();
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

            alert('Post saved.');
            
            this.setSavedForLaterChoices();
            
            this.savedForLaterChoicesSelect.removeActiveItems();
            this.savedForLaterChoicesSelect.setChoices(this.savedForLaterChoices, 'value', 'label', true);
        },

        onDeleteSavedFormLater: function () {
            if (this.savedForLater.value === '' || !confirm('Are you sure?')) {
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