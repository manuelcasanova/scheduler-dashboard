import React, { Component } from "react";

import Loading from "./Loading";
import Panel from "./Panel"

import classnames from "classnames";
import axios from "axios";
import { setInterview } from "helpers/reducers";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {
  state = {
    loading: true,
    focused: null, //Change to 1, 2, 3 or 4 for testing
    days: [],
    appointments: {},
    interviewers: {}
  }

//Function that can take an id and set the state of focused to the value of id

selectPanel(id) {
  this.setState(previousState => ({
    focused: previousState.focused !== null ? null : id
  }));
}

componentDidMount() {
  const focused = JSON.parse(localStorage.getItem("focused"));

  if (focused) {
    this.setState({ focused });
  }

  Promise.all([
    axios.get("/api/days"),
    axios.get("/api/appointments"),
    axios.get("/api/interviewers")
  ]).then(([days, appointments, interviewers]) => {
    this.setState({
      loading: false,
      days: days.data,
      appointments: appointments.data,
      interviewers: interviewers.data
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

  });

}

componentDidUpdate(previousProps, previousState) {
  if (previousState.focused !== this.state.focused) {
    localStorage.setItem("focused", JSON.stringify(this.state.focused));
  }
}

componentWillUnmount() {
  this.socket.close();
}
  
  render() {
    
    //If we put the console.log after the if(this.state.loading) condition we will only see the second output once the data is loaded.
    // console.log(this.state)

    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    if(this.state.loading) {
      return <Loading />;
    }

    const panels = (this.state.focused ? data.filter(panel => this.state.focused === panel.id) : data)
    .map(panel => (
<Panel
 key={panel.id}
 label={panel.label}
 value={panel.getValue(this.state)}
 onSelect={() => this.selectPanel(panel.id)}
/>
  
    ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
