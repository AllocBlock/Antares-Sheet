function save(name : string, data) {
    window.localStorage.setItem(name, data);
}

function load(name : string) {
    return window.localStorage.getItem(name);
}

export default {
    save,
    load
}