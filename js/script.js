// js/script.js
const { createApp } = Vue;

createApp({
  data() {
    return {
      options: [
        'Green Travel',
        'Interests-Based Recommendation',
        'Events',
        'Cheapest Destination',
        'Custom Criteria'
      ],
      selected: [],
      details: {},
      showInput: {},
      submitted: false
    };
  },
  methods: {
    toggleInput(option) {
      this.showInput[option] = this.selected.includes(option);
      if (!this.showInput[option]) {
        delete this.details[option];
      }
    },
    showSelection() {
      this.submitted = true;
    }
  }
}).mount('#app');

