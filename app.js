(function() {

  return {
    events: {
      'app.activated':'showFitnessActivity'
    },

    showFitnessActivity: function() {
      this.switchTo('fitness_activity',
        { activities:
          [
            {date: "1.09.2016", steps: 5000},
            {date: "2.09.2016", steps: 4500}
          ]
      });
    }
  };
}());
