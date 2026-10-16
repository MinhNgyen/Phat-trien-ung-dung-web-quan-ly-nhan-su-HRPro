const router = require('express').Router();
const c = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updatePayrollSettingSchema } = require('../validators/settings.validator');

router.use(authenticate);

// ADMIN, HR, ACCOUNTANT đều cần xem cấu hình lương để hiểu cách tính
router.get('/payroll', authorize('ADMIN', 'HR', 'ACCOUNTANT'), c.getPayrollSettings);
// Chỉ ADMIN, ACCOUNTANT được sửa cấu hình lương
router.put('/payroll', authorize('ADMIN', 'ACCOUNTANT'), validate(updatePayrollSettingSchema), c.updatePayrollSettings);

module.exports = router;
