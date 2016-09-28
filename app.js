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
      }
    },

    requests: {
      fetchActivities: function(ticket, period, date, count) {
        return {
          url: this.setting('host') + '/activities',
          type: 'GET',
          dataType: 'json',
          headers: { 'X-Auth-Token': this.setting('pear_up_api_token') },
          data: { 'zendesk_id': ticket.requester().id(), period: period, date: date, count: count }
        };
      },

      updateUser: function(params) {
        return {
          url: this.setting('host') + '/zendesk/users/' + params.userId,
          type: 'PATCH',
          dataType: 'json',
          headers: { 'X-Auth-Token': this.setting('pear_up_api_token') },
          data: params.data
        };
      }
    },

    updateUser: function(property) {
      var params = { userId: this.user().id(), data: { user: {} } };
      params.data.user[property] = this.user()[property];

      this.ajax('updateUser', params).done(function(){
        var message = "The user's " + property + " was successfully synchronized.";

        this.switchTo("success_message", { message: message });
      }).fail(function(data){
        this.switchTo("error_message", { message: this.parseError(property) });
      });
    },

    showFitnessActivity: function(params) {
      if(this.ticket === undefined) return;

      this.ajax('fetchActivities', this.ticket(), params.period, params.date, params.count).done(function(data) {
        var self = this;

        var activities = _.map(data, function(activity){
          return { date: self.formatDate(activity.date, params.period), steps_count: activity.steps_count };
        });

        this.switchTo('fitness_activity_by_' + params.period, { activities: activities });
      }).fail(function(data){
        this.switchTo('error_message', { message: "Something went wrong!" });
      });
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
