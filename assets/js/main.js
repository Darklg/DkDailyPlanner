document.addEventListener("DOMContentLoaded", function() {
    'use strict';

    var task_tpl = document.getElementById('task-template').innerHTML,
        $export = document.querySelector('[data-item="export-area"]'),
        $preview = document.querySelector('[data-item="preview-area"]'),
        $task_container = document.getElementById('task-container');

    /* Add a task */
    function add_task() {
        var $li = document.createElement('li');
        $li.innerHTML = task_tpl;
        $li.setAttribute('data-item', 'task-item');
        $task_container.appendChild($li);
        $li.querySelector('input[name="task_content"]').focus();
    }
    document.getElementById('add-task').addEventListener('click', function(e) {
        e.preventDefault();
        add_task();
    }, 1);
    add_task();

    /* Delete a task */
    $task_container.addEventListener('click', function(e) {
        if (e.target.getAttribute('data-action') != 'remove-task' && e.target.parentNode.getAttribute('data-action') != 'remove-task') {
            return;
        }
        e.preventDefault();
        var $li = e.target.closest('[data-item="task-item"]');
        delete_task($li)
    });

    function delete_task($obj) {
        $obj.parentNode.removeChild($obj);
        generate_export_preview();
    }

    /* Generate Export & Preview*/
    $task_container.addEventListener('change', generate_export_preview);
    $task_container.addEventListener('keyup', function(e) {
        generate_export_preview();
        if (event.key === "Enter") {
            add_task();
        }
    });

    function generate_export_preview() {

        var _startHour = 9;

        /* Build start date */
        var startTime = new Date();
        startTime.setHours(_startHour);
        startTime.setMinutes(0);
        startTime.setSeconds(0);

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

            /* Add to preview */
            _preview_content += '<div class="timeblock" style="height:' + duration / 5 + 'em;"><div class="timeblock-task">' + task + '</div></div>'

            /* Add to export */
            _export_content += 'today ' + startTime.getHours() + ':' + startTime.getMinutes();
            _export_content += ' ' + task;
            _export_content += ' [' + duration + 'm]' + "\n";

            /* Increment time */
            startTime.setTime(startTime.getTime() + (duration * 60 * 1000));
        });

        /* Build hours wrapper */
        for (var i = _startHour, len = startTime.getHours(); i <= len; i++) {
            _hours_content += '<div class="hour-item">' + i + ':00</div>';
        }

        $export.innerHTML = _export_content.trim();
        $export.style.height = ($export.scrollHeight + 5) + "px";
        $preview.innerHTML = '<div class="hours-wrapper">' + _hours_content + '</div><div class="timeblocks-wrapper">' + _preview_content + '</div>';
    }
});
