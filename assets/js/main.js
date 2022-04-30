/**
 * DK Daily Planner v 0.4.1
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
      Add a task
    ---------------------------------------------------------- */

    function add_task($elFrom) {
        var $li = document.createElement('li');
        $li.innerHTML = task_tpl;
        $li.setAttribute('data-item', 'task-item');
        if ($elFrom) {
            $elFrom.insertAdjacentElement('afterend', $li);
        }
        else {
            $task_container.appendChild($li);
        }
        $li.querySelector('input[name="task_content"]').focus();
    }
    document.getElementById('add-task').addEventListener('click', function(e) {
        e.preventDefault();
        add_task();
    }, 1);
    add_task();

    /* ----------------------------------------------------------
      Delete a task
    ---------------------------------------------------------- */

    $task_container.addEventListener('click', function(e) {
        if (e.target.getAttribute('data-action') != 'remove-task' && e.target.parentNode.getAttribute('data-action') != 'remove-task') {
            return;
        }
        e.preventDefault();
        delete_task(e.target.closest('[data-item="task-item"]'))
    });

    function delete_task($obj) {
        $obj.parentNode.removeChild($obj);
        regenerate_export();
    }

    /* ----------------------------------------------------------
      Load settings
    ---------------------------------------------------------- */

    if (localStorage.getItem('dkdailyplanner_settings')) {
        var _settings = JSON.parse(localStorage.getItem('dkdailyplanner_settings'));
        if (_settings.startHour) {
            $start_hour.value = _settings.startHour;
            $start_hour.dispatchEvent(new Event('change'))
        }
        if (_settings.startMinutes) {
            $start_minutes.value = _settings.startMinutes;
            $start_minutes.dispatchEvent(new Event('change'))
        }
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

    $task_container.addEventListener('change', function(e) {
        regenerate_export();
        if (e.target.getAttribute('name') == 'duration') {
            e.target.closest('[data-item="task-item"]').setAttribute('data-duration', e.target.value)
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
        var startTime = new Date();
        startTime.setHours(_startHour);
        startTime.setMinutes(_startMinutes);
        startTime.setSeconds(0);

        $item_startofday.setAttribute('data-duration', _startMinutes);

        /* Return values */
        var _export_content = '',
            _hours_content = '',
            _preview_content = '';

        /* Parse tasks */
        $task_container.querySelectorAll('[data-item="task-item"]').forEach(function(li) {
            var duration = parseInt(li.querySelector('[name="duration"]').value),
                task = li.querySelector('[name="task_content"]').value;

            /* Ignore empty task */
            if (!task) {
                return;
            }

            /* Add to export */
            _export_content += startTime.toISOString().slice(0, 10) + ' ' + startTime.getHours() + ':' + startTime.getMinutes();
            _export_content += ' ' + task;
            _export_content += ' [' + duration + 'm]' + "\n";

            /* Increment time */
            startTime.setTime(startTime.getTime() + (duration * 60 * 1000));
        });

        /* Build hours wrapper */
        for (var i = _startHour, len = startTime.getHours(); i <= len; i++) {
            _hours_content += '<div class="hour-item">' + i + ':00</div>';
        }

        $hours_wrapper.innerHTML = _hours_content.trim();
        $export.innerHTML = _export_content.trim();
        $export.style.height = ($export.scrollHeight + 5) + "px";
    }
});
