<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import Button from './Button.svelte';
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks } from './stores.js';
	
	export let initialValues;
	export let onSubmit;
	export let onBack;
	let currUser;
	let boxes;

	checks.subscribe(val => {boxes = val[$currentUserNum]});

	users.subscribe(val => {currUser = val[$currentUserNum]});
	
	const { form, data } = createForm({ onSubmit, initialValues })

	export let days = ["Monday   ", "Tuesday  ", "Wednesday ", "Thursday ", 
					   "Friday   ", "Saturday ", "Sunday   "];

	export let times = ["12:00 am", "12:15 am ", "12:30 am ", "12:45 am ",
						"1:00 am  ", "1:15 am  ", "1:30 am  ", "1:45 am  ",
						"2:00 am  ", "2:15 am  ", "2:30 am  ", "2:45 am  ",
						"3:00 am  ", "3:15 am  ", "3:30 am  ", "3:45 am  ",
						"4:00 am  ", "4:15 am  ", "4:30 am  ", "4:45 am  ",
						"5:00 am  ", "5:15 am  ", "5:30 am  ", "5:45 am  ",
						"6:00 am  ", "6:15 am  ", "6:30 am  ", "6:45 am  ",
						"7:00 am  ", "7:15 am  ", "7:30 am  ", "7:45 am  ",
						"8:00 am  ", "8:15 am  ", "8:30 am  ", "8:45 am  ",
						"9:00 am  ", "9:15 am  ", "9:30 am  ", "9:45 am  ",
						"10:00 am ", "10:15 am ", "10:30 am ", "10:45 am ",
						"11:00 am ", "11:15 am ", "11:30 am ", "11:45 am ",
						"12:00 pm ", "12:15 pm ", "12:30 pm ", "12:45 pm ",
						"1:00 pm  ", "1:15 pm  ", "1:30 pm  ", "1:45 pm  ",
						"2:00 pm  ", "2:15 pm  ", "2:30 pm  ", "2:45 pm  ",
						"3:00 pm  ", "3:15 pm  ", "3:30 pm  ", "3:45 pm  ",
						"4:00 pm  ", "4:15 pm  ", "4:30 pm  ", "4:45 pm  ",
						"5:00 pm  ", "5:15 pm  ", "5:30 pm  ", "5:45 pm  ",
						"6:00 pm  ", "6:15 pm  ", "6:30 pm  ", "6:45 pm  ",
						"7:00 pm  ", "7:15 pm  ", "7:30 pm  ", "7:45 pm  ",
						"8:00 pm  ", "8:15 pm  ", "8:30 pm  ", "8:45 pm  ",
						"9:00 pm  ", "9:15 pm  ", "9:30 pm  ", "9:45 pm  ",
						"10:00 pm ", "10:15 pm ", "10:30 pm ", "10:45 pm ",
						"11:00 pm ", "11:15 pm ", "11:30 pm ", "11:45 pm ",];
    
	export let dt = [];
	export let currAvail;
	let putItBackTogether = [];

	availabilities.subscribe(val => {currAvail = val[$currentUserNum]});

	export let ut = [];
	for (let i = 0; i < times.length; i++) {
	  ut.push(times[i] + currUser);
	}

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
			    <button type="button" class="notavailable sm" on:click={() => changeThisColor(dt[i][j], i, j, "auto")}>{time}  
			    </button>
			  </td>
			{/each}
	  </tr>
	  {/each}
	</table>
	<label for=aboutMe>Notes to host</label>
	<textarea id=aboutMe name=aboutMe /><br>
	<button type=button on:click={() => onBack($data)}>Previous page</button>
	<button type=submit>Submit</button>
</form>
