-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NULL,
    `role` ENUM('ADMIN', 'HR', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `head` VARCHAR(120) NULL,
    `color` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `position` VARCHAR(120) NULL,
    `salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `joined_at` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LEAVE') NOT NULL DEFAULT 'ACTIVE',
    `department_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_employee_code_key`(`employee_code`),
    UNIQUE INDEX `employees_email_key`(`email`),
    UNIQUE INDEX `employees_user_id_key`(`user_id`),
    INDEX `employees_department_id_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `grace_minutes` INTEGER NOT NULL DEFAULT 10,
    `overtime_rate` DECIMAL(3, 1) NOT NULL DEFAULT 1.5,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shifts_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_shifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `shift_id` INTEGER NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `employee_shifts_employee_id_shift_id_key`(`employee_id`, `shift_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `shift_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `check_in` VARCHAR(5) NULL,
    `check_out` VARCHAR(5) NULL,
    `work_hours` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `late_minutes` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'LEAVE') NOT NULL DEFAULT 'PRESENT',
    `type` ENUM('NORMAL', 'OVERTIME', 'REMOTE', 'BUSINESS_TRIP') NOT NULL DEFAULT 'NORMAL',
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_date_idx`(`date`),
    UNIQUE INDEX `attendance_employee_id_shift_id_date_key`(`employee_id`, `shift_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `base_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `work_days` INTEGER NOT NULL DEFAULT 0,
    `standard_days` INTEGER NOT NULL DEFAULT 26,
    `overtime` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `allowance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `deduction` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `gross_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `net_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payrolls_month_idx`(`month`),
    UNIQUE INDEX `payrolls_employee_id_month_key`(`employee_id`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `weight` INTEGER NOT NULL DEFAULT 1,
    `due_date` DATE NOT NULL,
    `completed_at` DATE NULL,
    `quality` INTEGER NULL,
    `assigned_by` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tasks_employee_id_due_date_idx`(`employee_id`, `due_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `total_tasks` INTEGER NOT NULL DEFAULT 0,
    `done_tasks` INTEGER NOT NULL DEFAULT 0,
    `on_time_tasks` INTEGER NOT NULL DEFAULT 0,
    `completion_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `on_time_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `quality_score` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kpis_employee_id_period_key`(`employee_id`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `company` VARCHAR(200) NULL,
    `email` VARCHAR(150) NULL,
    `lunch` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `fuel` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `phone_allow` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `ot` DECIMAL(3, 1) NOT NULL DEFAULT 1.5,
    `bhxh` DECIMAL(4, 2) NOT NULL DEFAULT 8,
    `bhyt` DECIMAL(4, 2) NOT NULL DEFAULT 1.5,
    `bhtn` DECIMAL(4, 2) NOT NULL DEFAULT 1,
    `personal_relief` DECIMAL(15, 2) NOT NULL DEFAULT 11000000,
    `standard_days` INTEGER NOT NULL DEFAULT 26,
    `late_penalty` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_locks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `is_locked` BOOLEAN NOT NULL DEFAULT true,
    `locked_by` INTEGER NULL,
    `locked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `salary_locks_month_key`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_shifts` ADD CONSTRAINT `employee_shifts_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_shifts` ADD CONSTRAINT `employee_shifts_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpis` ADD CONSTRAINT `kpis_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_locks` ADD CONSTRAINT `salary_locks_locked_by_fkey` FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
