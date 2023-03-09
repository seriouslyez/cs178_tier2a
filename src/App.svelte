<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
  import Page1 from "./components/Page1.svelte";
  import Page2 from "./components/Page2.svelte";
  import { users, numUsers, availabilities, currentUserNum, checks, locations, 
  startTimes, endTimes, timerNumber, days, times, locationNames, usersForTime, vchecks } from './components/stores.js';

  import { writable } from 'svelte/store';


  const pages = [Page1, Page2];
  let currUser;
  startTimes.subscribe(val => {})

  // The current page of our form.
  let page = 0;

  // The state of all of our pages
  let pagesState = [];

  function hasName(userStructure, targetName) {
    for (let i = 0; i < userStructure.length; i++) {
      if (userStructure[i] == targetName) {
        return i;
      }
    }
    return -1;
  }

  function convert(color) {
    if (color == "gray") {
      return "not available";
    }
    if (color == "green") {
      return "available";
    }
    return "if need be";
  }

  // Our handlers
  function onSubmit(values) {
    if (page === pages.length - 1) {
      // On our final page with POST our data somewhere
      pagesState[page] = values;
      pagesState = pagesState;
      console.log('Submitted data: ', pagesState);
      console.log('availabilities: ', $availabilities[$currentUserNum]);
      page = 0;
      
      let endTime = Date.now();
      endTimes.set($endTimes.concat([endTime]));
      console.log($endTimes[$timerNumber] - $startTimes[$timerNumber]);
      const downloadFile = () => {
         const link = document.createElement("a");
         let content = "Name,Start Time, End Time, Duration (Milliseconds)\n";

         for (let i = 0; i < $usersForTime.length; i++) {
           content = content + $usersForTime[i] + "," + new Date($startTimes[i]).toString() + "," + new Date($endTimes[i]).toString() + "," + ($endTimes[i] - $startTimes[i]).toString() + "\n";
         }

         const file = new Blob([content], { type: 'text/plain' });
         link.href = URL.createObjectURL(file);
         link.download = "timelogs.csv";
         link.click();
         URL.revokeObjectURL(link.href);
      };
      downloadFile();
    } else {
      // If we're not on the last page, store our data and increase a step
      let startTime = Date.now();
      startTimes.set($startTimes.concat([startTime]));
      timerNumber.update(n => n + 1);
      pagesState[page] = values;
      usersForTime.set($usersForTime.concat([values["firstName"] + " " + values["lastName"]]));
      let alreadyHere = hasName($users, values["firstName"] + " " + values["lastName"]);
      if (alreadyHere != -1) {
        currentUserNum.set(alreadyHere);
      } else {
        numUsers.update(n => n + 1);
        users.set($users.concat([values["firstName"] + " " + values["lastName"]]));
        let ca = [];
        let ch = [];
        let vch = [];
        for (let i = 0; i < times.length; i++) {
          ca.push([]);
          ch.push(false);
          for (let j = 0; j < days.length; j++) {
            ca[i].push("gray");
          }
        }
        locations.set($locations.concat([["gray", "gray", "gray", "gray", "gray"]]));
        availabilities.set($availabilities.concat([ca]));
        checks.set($checks.concat([ch]));
        vchecks.set($checks.concat([["gray", "gray", "gray", "gray", "gray", "gray", "gray"]]));
        currentUserNum.set($numUsers - 1);
      }
      pagesState = pagesState; // Triggering update
      page +=1;
    }
  }

  function onBack(values) {
    if (page === 0) return;
		pagesState[page] = values;
    pagesState = pagesState; // Triggering update
    page -= 1;
  }
</script>

<!-- We display the current step here -->
<svelte:component
  this={pages[page]}
  {onSubmit}
  {onBack}
  initialValues={pagesState[page]}
  />
