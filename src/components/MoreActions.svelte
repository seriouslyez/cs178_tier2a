<!-- Another #Component that will all for more actions to be added for more functionality. In this case, I will add checkAll and removeCompleted actions. -->

<script>
    import { createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();

    export let todos; // todos is also received as a #Property here with the export line, so that I can set the disabled property on each button when there is no elements in the todos array

    let completed = true;

    const checkAll = () => {
        dispatch("checkAll", completed);
        completed = !completed;
    }

    const removeCompleted = () => dispatch("removeCompleted");

    $: completedTodos = todos.filter((t) => t.completed).length; // completedTodos has been declared as a #Reactive variable so that the Remove Completed button is disabled if there are no completed elements in the array

</script>

<div class="btn-group">
    <button type="button" class="btn btn__primary" disabled={todos.length === 0} on:click={checkAll}>{completed ? 'Check' : 'Uncheck'} all</button>
    <button type="button" class="btn btn__primary" disabled={completedTodos === 0} on:click={removeCompleted}>Remove completed</button>
</div>