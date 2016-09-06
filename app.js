(function() {

  return {
    events: {
      'app.activated':'showFitnessActivity'
    },

    requests: {
      fetchActivities: function(settings, ticket) {
        return {
          url: settings.host + '/activities',
          type: 'GET',
          dataType: 'json',
          headers: { 'X-Auth-Token': settings.pear_up_api_token },
          data: { 'zendesk_id': ticket.requester().id() }
        };
      }
    },

    showFitnessActivity: function() {
      this.ajax('fetchActivities', this.settings, this.ticket()).done(function(data) {
        this.switchTo('fitness_activity', { activities: data });
      }).fail(function(data){
        var error = data.responseJSON['rails_api_format/error'].error;
        this.switchTo('error_message', { error: error });
      });
    }
  };
}());
