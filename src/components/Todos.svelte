<!-- Todos.svelte -->
<!-- #Component Todos.svelte is a component that we have created for our todo list-->

<script>
    import { listen_dev } from "svelte/internal";
    import FilterButton from './FilterButton.svelte';
    import Todo from './Todo.svelte';
    import MoreActions from "./MoreActions.svelte";
    import NewTodo from "./NewTodo.svelte";
    import TodosStatus from "./TodosStatus.svelte";

  let todosStatus;

  export let todos = [] //#Properties ... with export, we are able to mark todos as a property so that we can accept a todos attribute

  function removeTodo(todo) {
    todos = todos.filter((t) => t.id !== todo.id);
    todosStatus.focus(); // gives focus to the status heading
  }

  function addTodo(name) {
    todos = [...todos, { id: newTodoId, name, completed: false }];
  }

  $: newTodoId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;  // #Reactive values used for listening to DOM events. This reactive value will make sure that the current value of the id is retained so that when a new todo is added, its id can be created based on the last new id
  
  let filter = 'all'
  const filterTodos = (filter, todos) => 
    filter === 'active' ? todos.filter((t) => !t.completed) :
    filter === 'completed' ? todos.filter((t) => t.completed) :
    todos

  function updateTodo(todo) {
    const i = todos.findIndex((t) => t.id === todo.id)
    todos[id] = { ...todos[i], ...todo}
  }

  const checkAllTodos = (completed) => { 
    todos.forEach((t, i) => todos[i].completed = completed);
  }

  const removeCompletedTodos = () => todos = todos.filter((t) => !t.completed);

</script>

<div class="todoapp stack-large">

  <!-- NewTodo -->
  <!-- autofocus is passed as a #Property into the <NewTodo> #Component call-->
  <NewTodo autofocus on:addTodo={(e) => addTodo(e.detail)} />

  <!-- Filter -->
  <!-- Takes current filter as #Properties from the Filter #Component-->

  <!-- #Binding filter allows two way binding between the parent and child. Any changes made to the filter #Property in the FilterButton #Component will propogate back up to the parent #Component Todos -->
  <FilterButton bind:filter />
    <button class="btn toggle-btn" class:btn__primary={filter === 'all'} aria-pressed={filter === 'all'} on:click={() => filter = 'all'}>
      <span class="visually-hidden">Show</span>
      <span>All</span>
      <span class="visually-hidden">tasks</span>
    </button>
    <button class="btn toggle-btn" class:btn__primary={filter === 'active'} aria-pressed={filter === 'active'} on:click={() => filter = 'active'} >
      <span class="visually-hidden">Show</span>
      <span>Active</span>
      <span class="visually-hidden">tasks</span>
    </button>
    <button class="btn toggle-btn" class:btn__primary={filter === 'completed'} aria-pressed={filter === 'completed'} on:click={() => filter = 'completed'} >
      <span class="visually-hidden">Show</span>
      <span>Completed</span>
      <span class="visually-hidden">tasks</span>
    </button>
  

  <!-- TodosStatus -->
  <!-- todos is passed as a #Property to the TodosStatus #Component -->
  <!-- The TodosStatus #Component has #Binding to itself, which gives reference to the instance of TodosStatus-->
  <TodosStatus bind:this={todosStatus} {todos} />

  <!-- Todos -->
  
  
  <ul role="list" class="todo-list stack-large" aria-labelledby="list-heading">
    <!-- #controlFlow #each This use of #each allows iteration over each of the todos
  and a checkbox is created for each todo with the id and the name listed. -->
  <!-- #Formatted values are also used here to update the text next to each check box. 
  If the ids or names of the todos were to change, the values would be automatically updated-->

  <!-- The current todo object is passed into the Todos.svelte #Component as a #Property-->
    {#each filterTodos(filter, todos) as todo (todo.id)}
    <li class="todo">
      <Todo {todo} on:update={(e) => updateTodo(e.detail)} on:remove={(e) => removeTodo(e.detail)} />
    </li>
    {:else}
    <li>Nothing to do here!</li>
    {/each}
  </ul>

  <!-- We pass todos as a #Property into MoreActions so that it can be used within that component-->
  <MoreActions {todos}
    on:checkAll={(e) => checkAllTodos(e.detail)}
    on:removeCompleted={removeCompletedTodos}
  />

</div>