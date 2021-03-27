if (!window.indexedDB) {
  alert(
    "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
  );
}

const request = window.indexedDB.open("toDoListWithSW", 2);
var db;


request.onsuccess = function (event) {
  console.log("check out some data about our opened db: ", request.result);
  db = event.target.result; 
  getTasks();
};

request.onerror = function (event) {
  alert("Uh oh something went wrong :( ", request.error);
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  let store = db.createObjectStore("tasks", {
    keyPath: "id",
    autoIncrement: true,
  });
  store.createIndex("name", "name", { unique: false });
};

function getTasks() {
  var transaction = db.transaction("tasks", "readwrite");
  var tasksStore = transaction.objectStore("tasks");
  var retrievedb = tasksStore.getAll();
  // if the user is connected to the internet we should check if they...
  // ...entered anything to indexedDB while offline and send entrie(s) to the DB
    retrievedb.onsuccess = function () {
      if (retrievedb.result.length > 0 && navigator.onLine) {
        fetch("/todos", {
          method: "POST",
          body: JSON.stringify(retrievedb.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
        .then(response => {
          // open a new transaction to clear out indexedDB since we were able to...
          //...update our mysql DB - no need for duplicate data!
          // var transaction = db.transaction("tasks", "readwrite");
          // var tasksStore = transaction.objectStore("tasks");
          // tasksStore.clear();
          return response.json(); 
        })
        .catch(err =>{
          throw err;
        })
      }else{
        console.log("you are offline!")
        $(".container").prepend("<h3>Please reconnect to the internet to see the most up to date stuff!<h3/><p>You can still create tasks offline :D</p>")
        // if offline then display what is in indexedDB
        // show the user a message that they need to reconnect...
        // ...in order to see the most accurate data
        retrievedb.onsuccess = function () {
          console.log(retrievedb.result);
          $(".list-group").empty();
          retrievedb.result.map(function (item) {
            console.log(item);
            $(".list-group").append(
              "<li class='list-group-item'>" +
                item.id +
                ": " +
                item.name +
                "<button style='float: right' type='button' idNo=" +
                item.id +
                " class='btn btn-danger deleteBtn'>Delete Task</button>" +
                "<button style='float: right; margin-right:5px;' type='button' idNo=" +
                item.id +
                " class='btn btn-info editBtn' data-toggle='modal' data-target='#exampleModalCenter'>Edit Task</button>"
            );
          });
        };
      }

    }
}

$("#newTask").click(function () {
  var task = {
    name: $("#taskName").val().trim()
  };
  //send a request to the server to post our todo item\
  if (navigator.onLine) {
    fetch("/todo", {
      method: "POST",
      body: JSON.stringify(task),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      $("#taskName").val("");
      console.log("added task")
      getTasks()
      return response.json(); 
    })
  }else{
    // when offline we only want to add stuff to indexedDBd (in this code block we are offline)
    // this will act as a "queue" so that when the user is back online...
    // ...the app will check indexedDB and post all of the items to...
    // ... our mySQL db
    var transaction = db.transaction("tasks", "readwrite");
    var tasksStore = transaction.objectStore("tasks");
    let addReq = tasksStore.add({ name: task.name });
    addReq.onsuccess = function (e) {
      $("#taskName").val("");
      getTasks();
    };
  }
})

$(document).on("click", ".deleteBtn", function () {
  $("#offline").modal("show")
  let taskId = $(this).attr("idNo");
  if(navigator.onLine){
    fetch("/todo/"+taskId, {
      method: "DELETE",
    })
    .then(response => {
      console.log("deleted task")
      getTasks()
      return response.json(); 
    })
    .catch(err =>{
      throw err

    })
  }else{
    // if we are offline then we will tell the user that they can't delete stuff offline
    // currently thinking of new ways to handle delete and edit offline 
    // that would keep the site intuitive
    $("#offline").modal("show")
      // code to edit indexedDB if I want to delete offline
      // var transaction = db.transaction("tasks", "readwrite");
      // const store = transaction.objectStore("tasks");
      // var transaction = db.transaction("tasks", "readwrite");
      // var tasksStore = transaction.objectStore("tasks");
      // let addReq = tasksStore.add({ name: task.name });
      // addReq.onsuccess = function (e) {
      //   $("#taskName").val("");
      //   getTasks();
      // };
  }

  


});

$(document).on("click", ".editBtn", function () {
  let transaction = db.transaction("tasks", "readwrite");
  let tasksStore = transaction.objectStore("tasks");
  let taskId = $(this).attr("idNo");
  var requestForItem = tasksStore.get(Number(taskId));
  console.log("You are editing this item: ", requestForItem);

  requestForItem.onsuccess = function () {
    $(".editInput").val(requestForItem.result.name);
    $(".saveBtn").click(function () {
      let transaction = db.transaction("tasks", "readwrite");
      let tasksStore = transaction.objectStore("tasks");
      requestForItem.result.name = $(".editInput").val().trim();
      console.log("this is what you changed it to", requestForItem.result);
      var updateNameRequest = tasksStore.put(requestForItem.result);
      updateNameRequest.onerror = function () {
        console.log("something went wrong");
        console.log(updateNameRequest.error);
      };
      updateNameRequest.onsuccess = function () {
        console.log("you updated some entry!");
        $(".editInput").val("");
        $("#exampleModalCenter").modal("toggle");
        getTasks();
      };
    });
  };
});
