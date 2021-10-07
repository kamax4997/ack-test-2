// import mockValidations from './_validations';
import { isDevelopment } from '~/environment'

export { mockUsers } from './_users'

// const mockDb = async db => {
const mockDb = async () => {
  if (isDevelopment) {
    // const data = await db.models.Validation.find().lean();
    // if (!data || data.length < 1) {
    //   console.log(
    //     'DB | NODE_ENV is development and there is no data. I am creating mocks for validations'
    //   );
    //   db.models.Validation.insertMany(mockValidations);
    //   const validations = await db.models.Validation.find().lean();
    //   const user = await db.models.User.findOne({ email: 'admin@test.it' });
    //   validations.forEach(async validation => {
    //     await db.models.Validation.updateMany(
    //       { _id: validation._id },
    //       { users: [user._id] }
    //     );
    //   });
    // } else {
    //   console.log(
    //     'DB | NODE_ENV is development and there is already data for validations'
    //   );
    // }
    // return 'ok';
  }
  return null
}

export { mockDb }
