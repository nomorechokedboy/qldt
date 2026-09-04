# local_teachercourses

Moodle 5.0 local plugin (`local_teachercourses`) exposing web service functions for browsing course categories and courses scoped to the calling teacher, plus admin-facing "all categories/courses" variants. Called from [`apps/sms-api`](../../apps/sms-api/README.md) (`internal/mdlapi`) as part of the SMS product.

## Web service functions (`db/services.php`)

| Function | Class::method | Purpose |
| --- | --- | --- |
| `local_teachercourses_get_teacher_courses` | `get_teacher_courses::get_teacher_courses` | Courses taught by the calling user |
| `local_teachercourses_get_teacher_categories` | `get_teacher_categories::get_teacher_categories` | Categories the calling teacher has courses in |
| `local_teachercourses_get_teacher_courses_by_category` | `get_teacher_courses_by_category::get_teacher_courses_by_category` | Teacher's courses filtered to one category |
| `local_teachercourses_get_all_categories` | `get_all_categories::get_all_categories` | All categories (admin/manager) |
| `local_teachercourses_get_all_category_courses` | `get_all_category_courses::get_all_category_courses` | All courses in a category (admin/manager) |

## Install

Upload this directory to `<moodle>/local/teachercourses`, then:

```bash
php admin/cli/upgrade.php
php admin/cli/purge_caches.php
```

## Structure

```
teachercourses/
├── version.php          Plugin version/component metadata
├── db/services.php       Web service function registrations
├── classes/external/     get_all_categories, get_teacher_categories, get_teacher_courses,
│                         get_teacher_courses_by_category, get_all_category_courses
└── lang/                 Language strings
```

## Requirements

- Moodle 5.0+ (`requires` pinned to Moodle 4.0+ build in `version.php`)
- PHP 8.1+
