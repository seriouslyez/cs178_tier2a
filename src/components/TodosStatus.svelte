<!-- Another #Component; this pulls out the status heading as its own component-->

<script>
    export let todos; //#Properties ... with export, we are able to mark todos as a property so that we can accept a todos attribute
  $: totalTodos = todos.length;
  $: completedTodos = todos.filter((todo) => todo.completed).length;

  //#Reactive values are used for listening to DOM events; in this case, totalTodos and completedTodos are both instatiated when the script is executed and afterwards, Svelte will automatically update them whenever they change based on the array itself.

  let headingEl;

  export function focus() {
    // shorter version: export const focus = () => headingEl.focus()
    headingEl.focus();
  }
</script>

<!-- #Format values: whenever array above is updated, it updates the numbers displayed
    for how many todos are completed out of the total todos. -->
<!-- #Binding directive gives a reference to the DOM node in the variable headingEl-->
<h2 id="list-heading" bind:this={headingEl} tabindex="-1">
    {completedTodos} out of {totalTodos} items completed
</h2>