(function() {

  return {
    events: {
      'app.activated': function() {
        this.showFitnessActivity('day');
      },
      'click .show-by-hour': function(event) {
        this.showFitnessActivity('hour', this.$(event.target).text());
      },
      'click .show-by-day': function() {
        this.showFitnessActivity('day');
      }
    },

    requests: {
      fetchActivities: function(settings, ticket, period, date) {
        return {
          url: settings.host + '/activities',
          type: 'GET',
          dataType: 'json',
          headers: { 'X-Auth-Token': settings.pear_up_api_token },
          data: { 'zendesk_id': ticket.requester().id(), period: period, date: date }
        };
      }
    },

    showFitnessActivity: function(period, date) {
      this.ajax('fetchActivities', this.settings, this.ticket(), period, date).done(function(data) {
        var self = this;

        var activities = _.map(data, function(activity){
          return { date: self.formatDate(activity.date, period), steps_count: activity.steps_count };
        });

        this.switchTo('fitness_activity_by_' + period, { activities: activities });
      }).fail(function(data){
        var error = data.responseJSON['rails_api_format/error'].error;
        this.switchTo('error_message', { error: error });
      });
    },

    formatDate: function(date, period) {
      var moment_date = moment(date);

      if (period === 'hour') {
        return moment_date.utc().format("LT");
      } else {
        return moment_date.format("LL");
      }
    }
  };
}());
