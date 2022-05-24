/**
 * DK Daily Planner v 0.6.0
 */

document.addEventListener("DOMContentLoaded", function() {
    'use strict';

    var task_tpl = document.getElementById('task-template').innerHTML,
        $export = document.querySelector('[data-item="export-area"]'),
        $hours_wrapper = document.getElementById('hours-wrapper'),
        $start_hour = document.getElementById('select-starthour'),
        $start_minutes = document.getElementById('select-startminutes'),
        $item_startofday = document.getElementById('item-startofday'),
        $task_container = document.getElementById('tasks-container');

    /* Add dragndrop */
    new Sortable($task_container, {
        filter: '[data-disabled="1"]',
        onMove: function(e) {
            return e.related.getAttribute('data-disabled') != 1;
        },
        animation: 150,
    });

    /* ----------------------------------------------------------
      Set values
    ---------------------------------------------------------- */

    /* Build hours */
    for (var i = 0; i <= 23; i++) {
        var option = document.createElement("option");
        if (i == 9) {
            option.selected = true;
        }
        option.value = i;
        option.text = i;
        $start_hour.appendChild(option);
    }

    /* ----------------------------------------------------------
      Load settings
    ---------------------------------------------------------- */

    if (localStorage.getItem('dkdailyplanner_settings')) {
        var _settings = JSON.parse(localStorage.getItem('dkdailyplanner_settings'));
        if (_settings.startHour) {
            $start_hour.value = _settings.startHour;
        }
        if (_settings.startMinutes) {
            $start_minutes.value = _settings.startMinutes;
        }
    }

    /* ----------------------------------------------------------
      Add a task
    ---------------------------------------------------------- */

    function add_task($elFrom, _initialValues) {
        var $li = document.createElement('li');
        $li.innerHTML = task_tpl;
        $li.setAttribute('data-item', 'task-item');
        if ($elFrom) {
            $elFrom.insertAdjacentElement('afterend', $li);
        }
        else {
            $task_container.appendChild($li);
        }

        /* Load initial values */
        var $task = $li.querySelector('input[name="task_content"]'),
            $duration = $li.querySelector('select[name="duration"]');
        if (_initialValues && _initialValues.task) {
            $task.value = _initialValues.task;
        }
        if (_initialValues && _initialValues.duration) {
            $duration.querySelector('option[value="' + _initialValues.duration + '"]').setAttribute('selected', 'selected');
            $duration.dispatchEvent(new Event('change'));
            update_select_duration($duration);
        }

        /* Focus on input */
        $task.focus();
    }

    /* Initial tasks
    -------------------------- */

    (function() {
        var _tasks = JSON.parse(localStorage.getItem('dkdailyplanner_tasks'));
        if (_tasks && _tasks.length) {
            for (var i = 0, len = _tasks.length; i < len; i++) {
                add_task(false, _tasks[i]);
            }
            regenerate_export();
        }
        else {
            add_task();
            regenerate_export();
        }
    }());

    /* Add task
    -------------------------- */

    document.getElementById('add-task').addEventListener('click', function(e) {
        e.preventDefault();
        add_task();
        regenerate_export();
    }, 1);

    /* Select update
    -------------------------- */

    function update_select_duration($sel) {
        $sel.closest('[data-item="task-item"]').setAttribute('data-duration', $sel.value);
    }

    /* Handle paste
    -------------------------- */

    $task_container.addEventListener('paste', function(e) {
        if (e.target.getAttribute('name') != 'task_content') {
            return;
        }
        e.preventDefault();

        /* Get clean pasted data and split it */
        var val = (e.clipboardData || window.clipboardData).getData('text');
        val = val.trim().split("\n").map(function(item) {
            return item.trim();
        });
        if (val[0]) {
            e.target.value = val[0];
        }

        /* Insert each line as a new task */
        for (var i = 1, len = val.length; i < len; i++) {
            if (!val[i]) {
                continue;
            }
            add_task(false, {
                task: val[i]
            });
        }
    });

    /* ----------------------------------------------------------
      Delete a task
    ---------------------------------------------------------- */

    $task_container.addEventListener('click', function(e) {
        if (e.target.getAttribute('data-action') != 'remove-task' && e.target.parentNode.getAttribute('data-action') != 'remove-task') {
            return;
        }
        e.preventDefault();
        delete_task(e.target.closest('[data-item="task-item"]'));
    });

    function delete_task($obj) {
        $obj.parentNode.removeChild($obj);
        regenerate_export();
    }

    /* ----------------------------------------------------------
      Handle start of day
    ---------------------------------------------------------- */

    /* Hour */
    $start_hour.addEventListener('change', regenerate_export, 1);

    /* Minutes */
    $start_minutes.addEventListener('change', regenerate_export, 1);

    /* ----------------------------------------------------------
      Generate Export & Preview
    ---------------------------------------------------------- */

    document.addEventListener('change', function(e) {
        regenerate_export();
        if (e.target.getAttribute('name') == 'duration') {
            update_select_duration(e.target);
        }
    });
    $task_container.addEventListener('keyup', function(e) {
        regenerate_export();
        if (e.key === "Enter") {
            add_task(e.target.closest('[data-item="task-item"]'));
        }
    });
    regenerate_export();

    function regenerate_export() {

        var _startHour = parseInt($start_hour.value);
        var _startMinutes = parseInt($start_minutes.value);

        localStorage.setItem('dkdailyplanner_settings', JSON.stringify({
            startHour: _startHour,
            startMinutes: _startMinutes,
        }));

        /* Build start date */
        var startTime = new Date(),
            initialTime = new Date(),
            currentTime = new Date();
        startTime.setHours(_startHour);
        startTime.setMinutes(_startMinutes);
        startTime.setSeconds(0);

        /* Start tomorrow if too late */
        if (startTime.getTime() < currentTime.getTime()) {
            startTime.setTime(startTime.getTime() + (86400 * 1000));
        }

        initialTime.setTime(startTime.getTime());

        /* Set delta at start of day */
        $item_startofday.setAttribute('data-duration', _startMinutes);

        /* Return values */
        var _export_content = '',
            _hours_content = '',
            _tasks = [];

        /* Parse tasks */
        $task_container.querySelectorAll('[data-item="task-item"]').forEach(function(li) {
            var duration = parseInt(li.querySelector('[name="duration"]').value),
                task = li.querySelector('[name="task_content"]').value;

            /* Only empty task */
            if (task) {
                /* Add to export */
                _export_content += startTime.toISOString().slice(0, 10) + ' ' + startTime.getHours() + ':' + String(startTime.getMinutes()).padStart(2, "0");
                _export_content += ' ' + task;
                _export_content += ' [' + duration + 'm]' + "\n";

                _tasks.push({
                    task: task,
                    duration: duration
                });
            }

            /* Increment time */
            startTime.setTime(startTime.getTime() + (duration * 60 * 1000));

        });

        localStorage.setItem('dkdailyplanner_tasks', JSON.stringify(_tasks));

        /* Build hours wrapper */
        while (initialTime.getTime() < startTime.getTime()) {
            _hours_content += '<div class="hour-item">' + initialTime.getHours() + ':00</div>';
            initialTime.setTime(initialTime.getTime() + (3600 * 1000));
        }

        $hours_wrapper.innerHTML = _hours_content.trim();
        $export.value = _export_content.trim();
        $export.style.height = ($export.scrollHeight + 5) + "px";
    }
});
