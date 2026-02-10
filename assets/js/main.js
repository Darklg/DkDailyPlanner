/**
 * DK Daily Planner v 0.8.0
 */

document.addEventListener("DOMContentLoaded", function() {
    'use strict';

    var task_tpl = document.getElementById('task-template').innerHTML,
        $export = document.querySelector('[data-item="export-area"]'),
        $hours_wrapper = document.getElementById('hours-wrapper'),
        $start_hour = document.getElementById('select-starthour'),
        $start_minutes = document.getElementById('select-startminutes'),
        $start_day = document.getElementById('select-startday'),
        $select_now = document.getElementById('select-now'),
        $item_startofday = document.getElementById('item-startofday'),
        $task_container = document.getElementById('tasks-container'),
        $reset_planner = document.getElementById('reset-planner');

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
        if (_settings.startDay) {
            $start_day.value = _settings.startDay;
        }
    }

    if (!localStorage.getItem('dkdailyplanner_tasks')) {
        start_now();
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
        } else {
            $task_container.appendChild($li);
        }

        /* Load initial values */
        var $task = $li.querySelector('input[name="task_content"]'),
            $duration = $li.querySelector('select[name="duration"]');

        update_task_type($task);
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
        } else {
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

    /* Update type
    -------------------------- */

    function update_task_type($input) {
        var val = $input.value.trim(),
            $task = $input.closest('[data-item="task-item"]');
        $task.setAttribute('data-type', 'task');
        if (is_break_task(val)) {
            $task.setAttribute('data-type', 'break');
        }
    }

    function is_break_task(val) {
        return val.trim().startsWith('#');
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
            if (item.startsWith('- ')) {
                item = item.slice(2);
            }
            return item.trim();
        });
        if (val[0]) {
            var _val_details = get_task_details(val[0]);
            e.target.value = _val_details.task;
            var _tmp_select_duration = e.target.closest('[data-item="task-item"]').querySelector('select[name="duration"]');
            _tmp_select_duration.value = _val_details.duration;
            update_select_duration(_tmp_select_duration);

        }

        /* Insert each line as a new task */
        for (var i = 1, len = val.length; i < len; i++) {
            if (!val[i]) {
                continue;
            }
            add_task(false, get_task_details(val[i]));
        }
    });

    function get_task_details(val) {
        var duration = 15;
        var _match = val.match(/(\d+)(m| min| minutes|mn|)/i);
        if (_match) {
            duration = parseInt(_match[1]);
            val = val.replace(_match[0], '').trim();
        }
        return {
            task: val,
            duration: duration
        };
    }

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
      Start now
    ---------------------------------------------------------- */

    function start_now() {
        var now = new Date();
        var _day = 'today';
        var _hours = now.getHours();
        var _minutes = Math.round(now.getMinutes() / 15) * 15;
        if (_minutes == 0) {
            _minutes = '00';
        }
        if (_minutes == 60) {
            _minutes = '00';
            _hours += 1;
        }

        if (_hours == 24) {
            _hours = 0;
            _day = 'tomorrow';
        }

        $start_hour.value = _hours;
        $start_minutes.value = _minutes;
        $start_day.value = _day;
        regenerate_export();
    }

    /* ----------------------------------------------------------
      Handle start of day
    ---------------------------------------------------------- */

    /* Hour */
    $start_hour.addEventListener('change', regenerate_export, 1);

    /* Minutes */
    $start_minutes.addEventListener('change', regenerate_export, 1);

    /* Day */
    $start_day.addEventListener('change', regenerate_export, 1);

    /* Now button */
    $select_now.addEventListener('click', function(e) {
        e.preventDefault();
        start_now();

    }, 1);

    /* ----------------------------------------------------------
      Generate Export & Preview
    ---------------------------------------------------------- */

    document.addEventListener('change', function(e) {
        regenerate_export();
        if (e.target.getAttribute('name') == 'duration') {
            update_select_duration(e.target);
        }
    });
    $task_container.addEventListener('keydown', function(e) {
        if (e.key === "Backspace" && !e.target.value.trim()) {
            e.preventDefault();
            var $task_item = e.target.closest('[data-item="task-item"]');
            if ($task_item.previousElementSibling) {
                $task_item.previousElementSibling.querySelector('[name="task_content"]').focus();
            }
            delete_task($task_item);
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
        var _startDay = $start_day.value;

        localStorage.setItem('dkdailyplanner_settings', JSON.stringify({
            startHour: _startHour,
            startMinutes: _startMinutes,
            startDay: _startDay
        }));

        /* Build start date */
        var startTime = new Date(),
            initialTime = new Date(),
            currentTime = new Date();
        startTime.setHours(_startHour);
        startTime.setMinutes(_startMinutes)
        startTime.setSeconds(0);

        /* Start tomorrow if too late */
        if (startTime.getTime() < currentTime.getTime() && _startDay == 'tomorrow') {
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
                $input = li.querySelector('[name="task_content"]'),
                task = $input.value;

            /* Only empty task */
            if (task) {

                update_task_type($input);

                if (!is_break_task(task)) {

                    /* Add to export */
                    _export_content += startTime.toISOString().slice(0, 10) + ' ' + startTime.getHours() + ':' + String(startTime.getMinutes()).padStart(2, "0");
                    _export_content += ' pendant ' + duration + 'm';
                    _export_content += ' ' + task;
                    _export_content += "\n";
                }

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
        _hours_content += '<div class="hour-item">' + initialTime.getHours() + ':00</div>';
        while (initialTime.getTime() <= startTime.getTime()) {
            initialTime.setTime(initialTime.getTime() + (3600 * 1000));
            _hours_content += '<div class="hour-item">' + initialTime.getHours() + ':00</div>';
        }
        $hours_wrapper.innerHTML = _hours_content.trim();
        $export.value = _export_content.trim();
        $export.style.height = ($export.scrollHeight + 5) + "px";
    }

    /* ----------------------------------------------------------
      Reset planner
    ---------------------------------------------------------- */

    $reset_planner.addEventListener('click', function(e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to reset the planner? This will delete all your tasks and settings.')) {
            return;
        }
        localStorage.removeItem('dkdailyplanner_tasks');
        localStorage.removeItem('dkdailyplanner_settings');
        location.reload();
    });
});
