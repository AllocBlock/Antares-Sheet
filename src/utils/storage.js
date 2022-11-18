function save(name, data) {
    window.localStorage.setItem(name, data);
}

function load(name) {
    return window.localStorage.getItem(name);
}

export default {
    save,
    load
}