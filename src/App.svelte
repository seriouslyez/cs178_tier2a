<script>
  import Todos from "./components/Todos.svelte";

  let todos = [
    { id: 1, name: "Create a Svelte starter app", completed: true },
    { id: 2, name: "Create your first component", completed: true },
    { id: 3, name: "Complete the rest of the tutorial", completed: false }
  ];
</script>

<!-- In the script above, we pass our todos as #Properties to our #Component Todos.svelte-->


<!-- Below, we render our todos #Properties, which are passed in from the App.svelte #Component -->
<Todos {todos} />
