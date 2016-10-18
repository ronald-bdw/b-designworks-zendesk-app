(function() {

  return {
    events: {
      'app.activated': function() {
        this.showFitnessActivity({ period: 'day', count: 7 });
      },

      'click .show-by-hour': function(event) {
        this.showFitnessActivity({ period: 'hour', date: this.$(event.target).text() });
      },

      'click .show-by-day': function() {
        this.showFitnessActivity({ period: 'day', count: 7 });
      },

      'user.email.changed': function() {
        this.updateUser("email");
      },

      'user.name.changed': function() {
        this.updateUser("name");
      },

      'pane.activated': 'showSyncronizeButton',

      'click .synchronize-users': 'synchronizeUsers'
    },

    requests: {
      fetchActivities: function(params) {
        return {
          url: this.setting('host') + '/activities',
          type: 'GET',
          dataType: 'json',
          secure: true,
          headers: { 'X-Auth-Token': '{{setting.pear_up_api_token}}' },
          data: params
        };
      },

      updateUser: function(params) {
        return {
          url: this.setting('host') + '/zendesk/users/' + params.userId,
          type: 'PUT',
          dataType: 'json',
          secure: true,
          headers: { 'X-Auth-Token': '{{setting.pear_up_api_token}}' },
          data: params.data
        };
      },

      synchronizeUsers: function(params) {
        return {
          url: this.setting('host') + '/zendesk/users/fetch',
          type: 'POST',
          dataType: 'json',
          secure: true,
          headers: { 'X-Auth-Token': '{{setting.pear_up_api_token}}' },
          data: params.data
        };
      }
    },

    synchronizeUsers: function() {
      var params = { data: { notify_email: this.currentUser().email() } };

      this.ajax('synchronizeUsers', params).done(function() {
        this.syncRequestIsSended = true;
        this.switchTo("success_message", { message: "Users will be synchronized" });
      });
    },

    updateUser: function(property) {
      var params = { userId: this.user().id(), data: { user: {} } };
      params.data.user[property] = this.user()[property];

      this.ajax('updateUser', params).done(function(){
        var message = "The user's " + property + " was successfully synchronized.";

        services.notify(message, "notice")
      }).fail(function(data){
        services.notify(this.parseError(property), "error")
      });
    },

    showFitnessActivity: function(params) {
      if(this.ticket === undefined) return;

      params.zendesk_id = this.ticket().requester().id();

      this.ajax('fetchActivities', params).done(function(data) {
        var self = this;

        var activities = _.map(data, function(activity){
          return { date: self.formatDate(activity.date, params.period), steps_count: activity.steps_count };
        });

        this.switchTo('fitness_activity_by_' + params.period, { activities: activities });
      }).fail(function(data){
        this.switchTo('error_message', { message: "Something went wrong!" });
      });
    },

    showSyncronizeButton: function() {
      this.popover({ width: 300, height: 100 });

      if(this.currentUser().role() !== 'admin') {
        this.switchTo('error_message', { message: "You don't have access to this feature!" });
        return;
      }

      if(this.syncRequestIsSended) {
        this.switchTo("success_message", { message: "Users will be synchronized" });
      } else {
        this.switchTo("synchronize_users");
      }
    },

    formatDate: function(date, period) {
      var moment_date = moment(date);

      if (period === 'hour') {
        return moment_date.utc().format("LT");
      } else {
        return moment_date.format("LL");
      }
    },

    parseError: function(property) {
      var baseMessage = "Can't synchronize user's " + property + ". ";
      var addMessage = { name: "Please use client's first and last name" }[property];

      return baseMessage + addMessage;
    }
  };
}());
