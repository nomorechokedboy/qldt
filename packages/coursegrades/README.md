# local_coursegrades

Moodle 5.0 local plugin (`local_coursegrades`) exposing web service functions that let a teacher pull a course's graded activities together with every enrolled student's grades in one call. Called from [`apps/sms-api`](../../apps/sms-api/README.md) (`internal/mdlapi`) as part of the SMS product.

## Web service functions (`db/services.php`)

| Function | Class::method | Capability | Purpose |
| --- | --- | --- | --- |
| `local_coursegrades_get_course_data` | `local_coursegrades\external\get_course_data::get_course_data` | `moodle/grade:viewall` | Course info + graded modules + all students' grades (teacher view) |
| `local_coursegrades_get_student_grades` | `local_coursegrades\external\get_student_grades::get_student_grades` | — | A single student's grades |

Both are registered against `MOODLE_OFFICIAL_MOBILE_SERVICE` and callable via AJAX/the Moodle web services REST endpoint.

## Install

Upload this directory to `<moodle>/local/coursegrades`, then:

```bash
php admin/cli/upgrade.php
php admin/cli/purge_caches.php
```

## Structure

```
coursegrades/
├── version.php          Plugin version/component metadata
├── db/services.php       Web service function registrations
├── classes/external/     External API implementations (get_course_data, get_student_grades)
└── lang/                 Language strings
```

## Requirements

- Moodle 5.0+ (`requires` pinned to Moodle 4.0+ build in `version.php`)
- PHP 8.1+
