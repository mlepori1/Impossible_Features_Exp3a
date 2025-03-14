function saveData() {
    var completion_date = new Date();
    jsPsych.data.get().push({ success: true, completion_time: completion_date, exp_type: "gesture-beat-expt-pilot" });
  
    var full_data = jsPsych.data.get().json();
    console.log(full_data);
    $.ajax({
        type: "POST",
        url: "https://mlepori.pythonanywhere.com/save-json",
        data: JSON.stringify({ 'prolific_data': jsPsych.data.dataProperties, 'data': full_data, 'dir_path': "data/experiment_3a_pilot"}),
        contentType: "application/json"
    })
        .done(function () {
            window.location.href = "finish.html";
        })
        .fail(function () {
            alert("A problem occurred while writing to the database. Please contact the researcher for more information.")
        })
  }