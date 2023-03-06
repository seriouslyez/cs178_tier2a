<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import Button from './Button.svelte';
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks, locations } from './stores.js';
	
	export let initialValues;
	export let onSubmit;
	export let onBack;
	let currUser;
	let boxes;
	let locs;

	checks.subscribe(val => {boxes = val[$currentUserNum]});

	users.subscribe(val => {currUser = val[$currentUserNum]});

	locations.subscribe(val => {locs = val[$currentUserNum]});
	
	const { form, data } = createForm({ onSubmit, initialValues })

	export let days = ["Monday   ", "Tuesday  ", "Wednesday ", "Thursday ", 
					   "Friday   ", "Saturday ", "Sunday   "];

	export let times = [
						"9:00 am  ", "9:15 am  ", "9:30 am  ", "9:45 am  ",
						"10:00 am ", "10:15 am ", "10:30 am ", "10:45 am ",
						"11:00 am ", "11:15 am ", "11:30 am ", "11:45 am ",
						"12:00 pm ", "12:15 pm ", "12:30 pm ", "12:45 pm ",
						"1:00 pm  ", "1:15 pm  ", "1:30 pm  ", "1:45 pm  ",
						"2:00 pm  ", "2:15 pm  ", "2:30 pm  ", "2:45 pm  ",
						"3:00 pm  ", "3:15 pm  ", "3:30 pm  ", "3:45 pm  ",
						"4:00 pm  ", "4:15 pm  ", "4:30 pm  ", "4:45 pm  ",
						"5:00 pm  ", "5:15 pm  ", "5:30 pm  ", "5:45 pm  ",
						"6:00 pm  ", "6:15 pm  ", "6:30 pm  ", "6:45 pm  ",];
    
	export let dt = [];
	export let currAvail;
	let putItBackTogether = [];

	availabilities.subscribe(val => {currAvail = val[$currentUserNum]});

	export let ut = [];
	for (let i = 0; i < times.length; i++) {
	  ut.push(times[i] + currUser);
	}
  
  export let locationNames = ["Cambridge (River)", "Cambridge (Yard)", 
                          "Cambridge (Quad)", "Allston", "Virtual"];

	for (let i = 0; i < times.length; i++) {
	    dt.push([]);
	    for (let j = 0; j < days.length; j++) {
	      dt[i].push(days[j] + times[i]);
	    }
	  }

	function changeColor(color) {
	  if (color == "gray") {
	    return "green";
	  }
	  if (color == "green") {
	    return "yellow";
	  }
	  return "gray";
	}

	function changeThisColor(id, i, j, auto) {
	  if (auto == "auto") {
		let currColor = document.getElementById(id).style.background;
		document.getElementById(id).style.background = 
		  changeColor(currColor);
		if (currColor == "green") {
		  boxes[i] = false;
		  $checks[$currentUserNum][i] = boxes[i];
		}
	  } else {
	    document.getElementById(id).style.background = auto;
	  }
	  currAvail[i][j] = document.getElementById(id).style.background;
	  $availabilities[$currentUserNum][i][j] = currAvail[i][j];
	  }

	function changeLocColor(id, i) {
		let currColor = document.getElementById(id).style.background;
		document.getElementById(id).style.background = changeColor(currColor);
	  locs[i] = document.getElementById(id).style.background;
	  $locations[$currentUserNum][i] = locs[i];
	}

	function clickCheckbox(row) {
	  console.log("hello");
      if (document.getElementById(ut[row]).checked) {
        for (let j = 0; j < days.length; j++) {
          changeThisColor(dt[row][j], row, j, "green");
        }
        boxes[row] = false;
      } else {
        for (let j = 0; j < days.length; j++) {
          changeThisColor(dt[row][j], row, j, "gray");
        } 
        boxes[row] = true;
      }
      $checks[$currentUserNum][row] = boxes[row];
	}


</script>

<div>
<h1>Enter Availability for {currUser}</h1>
<h2>Note: all times in Eastern Standard Time.</h2>
</div>

<form use:form>
    <table>
	  <tr>
	    <th nowrap>All Days</th>
	    {#each days as day, i}
	  		<th style="background:#ADD8E6">{day}</th>
		{/each}
	  </tr>
	  {#each times as time, i}
	  <tr id={i}>
	        <td><input type="checkbox" id={ut[i]} name={time} value={time} on:click={() => clickCheckbox(i)}></td>
			{#each days as day, j}
			  <td nowrap style="background:{currAvail[i][j]};color:black" id={dt[i][j]}>
			    <button style="width:100%" type="button" class="notavailable sm" on:click={() => changeThisColor(dt[i][j], i, j, "auto")}>{time}  
			    </button>
			  </td>
			{/each}
	  </tr>
	  {/each}
	</table>
	<br>
	<label for=aboutMe style="font-weight:bold;font-size:1.5em">Preferred Location(s)</label><br>
	{#each locationNames as location, i}
	<button id={location} style="background:{locs[i]};color:black;border:solid red 2px" type="button" class="notavailable sm" on:click={() => changeLocColor(location, i)}>{locationNames[i]}  
			    </button><br><br>
	{/each}
	<button type=button on:click={() => onBack($data)}>Previous page</button>
	<button type=submit>Submit</button>
</form>
