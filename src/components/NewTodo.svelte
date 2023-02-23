<!-- #Component that allows the creation of new todo items -->

<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { selectOnFocus } from '../actions';
    const dispatch = createEventDispatcher();

    export let autofocus = false; // autofocus #Property is added
  
    let name = '';
    let nameEl; // reference to the name input DOM node
  
    const addTodo = () => {
      dispatch('addTodo', name);
      name = '';
      nameEl.focus(); 
    }
  
    const onCancel = () => {
        name = '';
        nameEl.focus();
    }

    console.log('initializing:', nameEl);
    onMount(() => autofocus && nameEl.focus());
  
  </script>
  
  
  <form on:submit|preventDefault={addTodo} on:keydown={(e) => e.key === 'Escape' && onCancel()}>
    <h2 class="label-wrapper">
      <label for="todo-0" class="label__lg">What needs to be done?</label>
    </h2>
    <!-- <input> has #Binding to the name variable -->
    <input bind:value={name} bind:this={nameEl} use:selectOnFocus type="text" id="todo-0" autoComplete="off" class="input input__lg" />
    <button type="submit" disabled={!name} class="btn btn__primary btn__lg">Add</button>
  </form>
  