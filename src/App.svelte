<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
  import Page1 from "./components/Page1.svelte";
  import Page2 from "./components/Page2.svelte";
  import { users, numUsers, availabilities, currentUserNum, checks, locations } from './components/stores.js';
  import { writable } from 'svelte/store';


  const pages = [Page1, Page2];
  let currUser;
  users.subscribe(val => {currUser = val});

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

  // Our handlers
  function onSubmit(values) {
    if (page === pages.length - 1) {
      // On our final page with POST our data somewhere
      pagesState[page] = values;
      pagesState = pagesState;
      console.log('Submitted data: ', pagesState);
      console.log('availabilities: ', $availabilities[$currentUserNum]);
      page = 0;
    } else {
      // If we're not on the last page, store our data and increase a step
      pagesState[page] = values;
      let alreadyHere = hasName($users, values["firstName"] + " " + values["lastName"]);
      if (alreadyHere != -1) {
        currentUserNum.set(alreadyHere);
      } else {
        numUsers.update(n => n + 1);
        users.set($users.concat([values["firstName"] + " " + values["lastName"]]));
        let ca = [];
        let ch = [];
        for (let i = 0; i < 40; i++) {
          ca.push([]);
          ch.push(false);
          for (let j = 0; j < 7; j++) {
            ca[i].push("gray");
          }
        }
        locations.set($locations.concat([["gray", "gray", "gray", "gray", "gray"]]));
        console.log(ca);
        availabilities.set($availabilities.concat([ca]));
        checks.set($checks.concat([ch]));
        console.log(ch);
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
