<template>
  <router-view />
</template>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

::selection {
  background: var(--theme-color);
}

body {
  width: 100%;
  margin: 0;
  overflow-x: hidden;
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;
}

body[env="pc"] {
  font-size: var(--base-font-size);
}

body[env="mobile"] {
  --base-font-size: 5vw;
}

a,
a:link,
a:visited,
a:active,
a:focus {
  text-decoration: none;
}

*::-webkit-scrollbar {
  background-color: rgba(221, 221, 221, 0.3);
  width: 10px;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(224, 224, 224, 0.8);
  animation: all 0.3s ease-out;
  border-radius: 5px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
