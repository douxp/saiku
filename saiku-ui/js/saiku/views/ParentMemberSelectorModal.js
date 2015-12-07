/*
 *   Copyright 2015 OSBI Ltd
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

/**
 * Class for get a parent member
 *
 * @class ParentMemberSelectorModal
 */
var ParentMemberSelectorModal = Modal.extend({

    /**
     * Type name
     *
     * @property type
     * @type {String}
     * @private
     */
	type: 'parent-member-selector',

    /**
     * Property with main template of modal
     *
     * @property template_modal
     * @type {String}
     * @private
     */
	template_modal: _.template(
        '<form class="form-group">' +
        	'<div class="group-elements" style="padding-top: 0;">' +
				'<nav class="breadcrumbs">' +
				'</nav>' +
                '<span class="loading i18n">Loading...</span>' +
			'</div>' +
			'<div class="group-elements">' +
				'<label>Selected Level: <span class="selected-level"></span></label>' +
			'</div>' +
			'<div class="group-elements">' +
				'<ul class="members-list">' +
                    '<li class="i18n">Loading...</li>' +
				'<ul>' +
			'</div>' +
			'<div class="group-elements">' +
				'<input type="search" id="auto-filter" results="5" placeholder="Autocomplete Filter">' +
			'</div>' +
        '</form>'
	),

    /**
     * Events of buttons
     *
     * @property buttons
     * @type {Array}
     * @private
     */
    buttons: [
        { text: 'Add',    method: 'save' },
        { text: 'Clear',  method: 'clear' },
        { text: 'Cancel', method: 'close' }
    ],

    /**
     * The events hash (or method) can be used to specify a set of DOM events 
     * that will be bound to methods on your View through delegateEvents
     * 
     * @property events
     * @type {Object}
     * @private
     */
    events: {
        'click    .dialog_footer a' : 'call',
        'click    .crumb'           : 'fetch_crumb',
        'dblclick .member'          : 'drill_member',
        'keyup    #auto-filter'     : 'auto_filter'
    },

    /**
     * The constructor of view, it will be called when the view is first created
     *
     * @constructor
     * @private
     * @param  {Object} args Attributes, events and others things
     */
    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);
        this.workspace = args.workspace;
        this.options.title = 'Parent Member Selector';

        Saiku.ui.block('<span class="i18n">Loading...</span>');

        // Load template
        this.message = this.template_modal();

        this.bind('open', function() {
            if (_.isEmpty(this.uniqueName) && _.isEmpty(this.breadcrumbs)) {
                this.new_parent_member();
            }
            else {
                this.edit_parent_member();
            }
        });
    },

    /**
     * If is in new mode, then fetches levels
     *
     * @method new_parent_member
     * @private
     */
    new_parent_member: function() {
        var level = new Level({}, { 
            ui: this, 
            cube: this.cube, 
            dimension: this.dimension, 
            hierarchy: this.hierarchy 
        });

        level.fetch({
            success: this.get_levels
        });
    },

    /**
     * If is in edit mode, then fetches child members
     *
     * @method edit_parent_member
     * @private
     */
    edit_parent_member: function() {
        var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: this.uniqueName });
        levelChildMember.fetch({
            success: this.get_child_members
        });
    },

    /**
     * Populate breadcrumbs
     *
     * @method populate_breadcrumbs
     * @private
     * @param  {Array} data Array with breadcrumbs names
     */
    populate_breadcrumbs: function(data) {
        var $crumbs = [];
        var len = data.length;

        for (var i = 0; i < len; i++) {
            if (i !== (data.length - 1)) {
                if (i === 0 || i === 1) {
                    $crumbs.push('<a href="#fetch_crumb" class="crumb" data-position="' + i + '" data-action="false">' + data[i] + '</a> &gt;');
                }
                else {
                    $crumbs.push('<a href="#fetch_crumb" class="crumb" data-position="' + i + '" data-action="true">' + data[i] + '</a> &gt;');
                }
            }
            else {
                $crumbs.push('<span class="last-crumb">' + data[i] + '</span>');
            }
        }

        Saiku.ui.unblock();

        this.$el.find('.loading').remove();
        this.$el.find('.breadcrumbs').empty();
        this.$el.find('.breadcrumbs').append($crumbs);
    },

    /**
     * Populate members list
     *
     * @method populate_members_list
     * @private
     * @param  {Array} data Array with members list
     */
    populate_members_list: function(data) {
        var $members = [];
        var len = data.length;

        this.$el.find('.members-list').empty();

        for (var i = 0; i < len; i++) {
            $members = $('<li />')
                .addClass('member')
                .data('caption', data[i].caption)
                .data('uniqueName', data[i].uniqueName)
                .data('levelUniqueName', data[i].levelUniqueName ? data[i].levelUniqueName : false)
                .text(data[i].name);
            
            this.$el.find('.members-list').append($members);
        }

        Saiku.ui.unblock();
    },

    /**
     * Method that fetches the levels
     *
     * @method get_levels
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_levels: function(model, response) {
        var levelMember;

        if (response) {
            model.ui.breadcrumbs = [model.ui.dimension, model.ui.hierarchy, response[0].name];
            model.ui.populate_breadcrumbs(model.ui.breadcrumbs);
            model.ui.$el.find('.dialog_footer').find('a[href="#clear"]').data('name', response[0].name);
            levelMember = new LevelMember({}, { 
                ui: model.ui, 
                cube: model.ui.cube, 
                dimension: model.ui.dimension, 
                hierarchy: model.ui.hierarchy, 
                level: response[0].name 
            });
            levelMember.fetch({
                success: model.ui.get_members
            });
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Method that fetches the members
     *
     * @method get_members
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_members: function(model, response) {
        if (response) {
            model.ui.populate_members_list(response);
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Method that fetches the child members
     *
     * @method get_child_members
     * @private
     * @param  {Object} model    Returned data from the model
     * @param  {Array} response  Returned data from the server
     */
    get_child_members: function(model, response) {
        var levelUniqueName;
        var position;

        if (response && response.length > 0) {
            model.ui.populate_members_list(response);

            levelUniqueName = response[0].levelUniqueName.split('].[');
            levelUniqueName = _.last(levelUniqueName).replace(/[\[\]]/gi, '');

            model.ui.breadcrumbs.push(levelUniqueName);
            model.ui.breadcrumbs = _.uniq(model.ui.breadcrumbs);
            model.ui.uniqueName = model.uniqueName;

            position = _.indexOf(model.ui.breadcrumbs, levelUniqueName);

            model.ui.breadcrumbs = _.initial(model.ui.breadcrumbs, (model.ui.breadcrumbs.length - (position + 1)));

            model.ui.selected_level();

            model.ui.populate_breadcrumbs(model.ui.breadcrumbs);
        }
        else {
            Saiku.ui.unblock();
        }
    },

    /**
     * Drill in member
     *
     * @method drill_member
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    drill_member: function(event) {
        event.preventDefault();

        Saiku.ui.block('<span class="i18n">Loading...</span>');

        var $currentTarget = $(event.currentTarget);
        var uniqueName = $currentTarget.data('uniqueName');

        this.$el.find('#auto-filter').val('');

        var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: uniqueName });
        levelChildMember.fetch({
            success: this.get_child_members
        });        
    },

    /**
     * Auto filter in member
     *
     * @method auto_filter
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     * @example
     *     [USA].[CA].[Los Angeles]
     */
    auto_filter: function(event) {
        var $currentTarget = $(event.currentTarget);
        var uniqueName = $currentTarget.val();
        var levelChildMember = new LevelChildMember({}, { ui: this, cube: this.cube, uniqueName: uniqueName });
        if (uniqueName && !(_.isEmpty(uniqueName))) {
            levelChildMember.fetch({
                success: this.get_child_members
            });
        }
    },

    /**
     * Fetch crumbs
     *
     * @method fetch_crumb
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    fetch_crumb: function(event) {
        event.preventDefault();

        var $currentTarget = $(event.currentTarget);

        if ($currentTarget.data('action')) {

            var levelMember = new LevelMember({}, { 
                ui: this, 
                cube: this.cube, 
                dimension: this.dimension, 
                hierarchy: this.hierarchy, 
                level: $currentTarget.text() 
            });
            levelMember.fetch({
                success: this.get_members
            });

            this.uniqueName = '';
            this.$el.find('.selected-level').text('');
            this.$el.find('.members-list').empty();
            this.$el.find('.members-list').append('<li class="i18n">Loading...</li>');
            this.$el.find('#auto-filter').val('');
            this.breadcrumbs = _.initial(this.breadcrumbs, (this.breadcrumbs.length - (Number($currentTarget.data('position')) + 1)));
            // this.selected_level();
            this.populate_breadcrumbs(this.breadcrumbs);
        }
    },

    /**
     * Add a selected level
     *
     * @method selected_level
     * @private
     */
    selected_level: function() {
        var selectedLevel;

        if ((this.breadcrumbs.length - 2) < 2) {
            selectedLevel = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.$el.find('.selected-level').text(selectedLevel);
        }
        else {
            selectedLevel = this.breadcrumbs[this.breadcrumbs.length - 2];
            this.$el.find('.selected-level').text(selectedLevel);
        }
    },

    /**
     * Clear dialog
     *
     * @method clear
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    clear: function(event) {
        event.preventDefault();

        var name = $(this.el).find('.dialog_footer').find('a[href="#clear"]').data('name');
        var levelMember = new LevelMember({}, { 
            ui: this, 
            cube: this.cube, 
            dimension: this.dimension, 
            hierarchy: this.hierarchy, 
            level: name 
        });
        levelMember.fetch({
            success: this.get_members
        });

        this.uniqueName = '';
        this.$el.find('.selected-level').text('');
        this.$el.find('.members-list').empty();
        this.$el.find('.members-list').append('<li class="i18n">Loading...</li>');
        this.$el.find('#auto-filter').val('');

        var position = _.indexOf(this.breadcrumbs, name);

        this.breadcrumbs = _.initial(this.breadcrumbs, (this.breadcrumbs.length - (position + 1)));
        this.populate_breadcrumbs(this.breadcrumbs);
    },

    /**
     * Add uniqueName and breadcrumbs in dialog Calculated Member
     *
     * @method save
     * @private
     * @param {Object} event The Event interface represents any event of the DOM
     */
    save: function(event) {
        event.preventDefault();

        var alertMsg = '';

        if (typeof this.uniqueName === 'undefined' || _.isEmpty(this.uniqueName)) {
            alertMsg += 'You have to choose a member for the calculated member!';
        }
        if (alertMsg !== '') {
            alert(alertMsg);
        }
        else {
            var dimHier = '[' + this.dimension + '].[' + this.hierarchy + '].';
            var uniqueName = this.uniqueName.split(dimHier)[1] !== undefined ?
                             this.uniqueName.split(dimHier)[1] :
                             this.uniqueName.split(dimHier)[0];
            
            // console.log(uniqueName);
            // console.log(this.breadcrumbs);
            
            this.dialog.pmsUniqueName = uniqueName;
            this.dialog.pmsBreadcrumbs = _.uniq(this.breadcrumbs);
            this.$el.dialog('close');
        }
    }
});