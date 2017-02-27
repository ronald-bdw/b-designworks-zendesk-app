(function() {

  return {
    events: {
      "app.activated": "renderPage",

      "click .show-by-hour": function(event) {
        this.showFitnessActivity({ source: this.$(event.target).data("source"), period: "hour", date: this.$(event.target).text() });
      },

      "click .show-by-day": function() {
        this.showFitnessActivity({ source: "fitbit", period: "day", count: 7 });
      },

      "user.email.changed": function() {
        this.updateUser("email");
      },

      "user.name.changed": function() {
        this.updateUser("name");
      },

      "user.first_popup_active.changed": function() {
        this.updateUser("first_popup_active");
      },

      "user.second_popup_active.changed": function() {
        this.updateUser("second_popup_active");
      },

      "organization.name.changed": function() {
        this.updateOrganization("name");
      },

      "organization.first_popup_message.changed": function() {
        this.updateOrganization("first_popup_message");
      },

      "organization.second_popup_message.changed": function() {
        this.updateOrganization("second_popup_message");
      },

      "submit #create_subscriber": "createNotificationSubscriber",

      "pane.activated": "showSyncronizeButton",

      "click .synchronize-users": "synchronizeUsers",
      "click .synchronize-organizations": "synchronizeOrganizations",

      "click .unsubscribe-agent": function(event) {
        this.unsubscribeAgent(this.$(event.target).data("agent"));
      },

      "click .show-by-source": function(event) {
        this.showFitnessActivity({ source: this.$(event.target).data("source"), period: "day", count: 7 });
      },
    },

    requests: {
      fetchActivities: function(params) {
        return {
          url: this.setting("host") + "/activities",
          type: "GET",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" },
          data: params
        };
      },

      updateUser: function(params) {
        return {
          url: this.setting("host") + "/zendesk/users/" + params.userId,
          type: "PUT",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{setting.pear_up_api_token}}" },
          data: params.data
        };
      },

      updateOrganization: function(params) {
        return {
          url: this.setting("host") + "/zendesk/organizations/" + params.organizationId,
          type: "PUT",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{setting.pear_up_api_token}}" },
          data: params.data
        };
      },

      synchronizeUsers: function(params) {
        return {
          url: this.setting("host") + "/zendesk/users/fetch",
          type: "POST",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" },
          data: params.data
        };
      },

      synchronizeOrganizations: function(params) {
        return {
          url: this.setting("host") + "/zendesk/organizations/fetch",
          type: "POST",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" },
          data: params.data
        };
      },

      getUser: function(params) {
        return {
          url: this.setting("host") + "/zendesk/users/" + params.userId,
          type: "GET",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" }
        };
      },

      getNotificationSubscribers: function() {
        return {
          url: this.setting("host") + "/zendesk/notification_subscribers",
          type: "GET",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" }
        };
      },

      createNotificationSubscriber: function(params) {
        return {
          url: this.setting("host") + "/zendesk/notification_subscribers",
          type: "POST",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" },
          data: params.data
        };
      },

      unsubscribeAgent: function(params) {
        return {
          url: this.setting("host") + "/zendesk/notification_subscribers/" + params.agentId,
          type: "DELETE",
          dataType: "json",
          secure: true,
          headers: { "X-Auth-Token": "{{ setting.pear_up_api_token }}" }
        };
      }
    },

    renderPage: function() {
      if(this.ticket) {
        this.showFitnessActivity({ source: "fitbit", period: "day", count: 7 });
      } else if(this.user) {
        this.showUserDetails();
      }
    },

    unsubscribeAgent: function(agentId) {
      var params = { agentId: agentId };

      this.ajax("unsubscribeAgent", params).done(function() {
        this.showSyncronizeButton();
      }).fail(function() {
        services.notify("Something went wrong!", "error");
      });
    },

    createNotificationSubscriber: function(event) {
      event.preventDefault();

      var params = {
        data: {
          email: this.$("#subscriber_email").val(),
          notification_types: ["first_user_login", "registration_complete"]
        }
      };

      this.ajax("createNotificationSubscriber", params).done(function(){
        this.showSyncronizeButton();
      }).fail(function(data){
        console.log(data);
        services.notify(data.responseJSON.errors, "error");
      });
    },

    synchronizeUsers: function() {
      var params = { data: { notify_email: this.currentUser().email() } };

      this.ajax("synchronizeUsers", params).done(function() {
        services.notify("Users will be synchronized", "notice");
      }).fail(function(){
        services.notify("Something went wrong!", "error");
      });
    },

    synchronizeOrganizations: function() {
      var params = { data: { notify_email: this.currentUser().email() } };

      this.ajax("synchronizeOrganizations", params).done(function() {
        services.notify("Organizations will be synchronized", "notice");
      }).fail(function(){
        services.notify("Something went wrong!", "error");
      });
    },

    updateUser: function(property) {
      var params = { userId: this.user().id(), data: { user: {} } };
      var user = this.user();
      var userProperty = user[property] ? user[property] : user.customField(property);

      params.data.user[property] = userProperty;

      this.ajax("updateUser", params).done(function(){
        var message = "The user's " + property + " was successfully synchronized.";

        services.notify(message, "notice");
      }).fail(function(data){
        services.notify(this.parseError(property), "error");
      });
    },

    updateOrganization: function(property) {
      var params = { organizationId: this.organization().id(), data: { organization: {} } };
      var organization = this.organization();
      var organizationProperty = organization[property] ? organization[property] : organization.customField(property);

      params.data.organization[property] = organizationProperty;

      this.ajax("updateOrganization", params).done(function(){
        var message = "The organization's " + property + " was successfully synchronized.";

        services.notify(message, "notice");
      }).fail(function(data){
        services.notify(this.parseError(property), "error");
      });
    },

    showFitnessActivity: function(params) {
      var user = this.ticket().requester();

      params.zendesk_id = user.id();
      params.timezone = user.timeZone().ianaName();

      this.ajax("fetchActivities", params).done(function(data) {
        var self = this;

        var sourcesLists = [
          { title: "Fitbit", type: "fitbit" },
          { title: "Googlefit", type: "googlefit" },
          { title: "HealthKit", type: "healthkit" }
        ];

        var activities = _.map(data, function(activity){
          return { date: self.formatDate(activity.date, params.period, params.timezone), steps_count: activity.steps_count, source: params.source };
        });

        this.switchTo("fitness_activity_by_" + params.period, { source: params.source, activities: activities, sourcesLists: sourcesLists });
        if ( params.source ) {
          this.$(".show-by-source[data-source=" + params.source + "]").addClass("active");
        }
      }).fail(function() {
        this.switchTo("error_message", { message: "Something went wrong!" });
      });
    },

    showUserDetails: function() {
      var params = { userId: this.user().id() };

      this.ajax("getUser", params).done(function(data) {
        this.switchTo("user_details", { user: data.user });
      }).fail(function() {
        this.switchTo("error_message", { message: "Something went wrong!" });
      });
    },

    showSyncronizeButton: function() {
      if(this.currentUser().role() !== "admin") {
        this.switchTo("error_message", { message: "You don't have access to this feature!" });
        return;
      }

      this.ajax("getNotificationSubscribers").done(function(data) {
        this.switchTo("synchronize_users", { subscribers: data.notification_subscribers });
      });
    },

    formatDate: function(date, period, timezone) {
      var moment_date = moment(date);

      if (period === "hour") {
        return moment_date.tz(timezone).format("D MMM, LT");
      } else {
        return moment_date.tz(timezone).format("LL");
      }
    },

    parseError: function(property) {
      var baseMessage = "Can't synchronize user's " + property + ". ";
      var addMessage = { name: "Please use client's first and last name" }[property];

      return baseMessage + addMessage;
    }
  };
}());
