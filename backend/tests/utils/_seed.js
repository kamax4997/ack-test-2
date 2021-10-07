import { mockUsers } from '../../src/mocks'
import {
  mockUsers as testMockUsers,
  resources,
  companies,
  messages,
  courses,
  partners,
  marriage,
  families,
} from '../fixtures'

export default async db => {
  const mockedUsers = [...mockUsers, ...testMockUsers]
  const users = await mockedUsers.reduce(async (arr, user) => {
    // eslint-disable-next-line no-param-reassign
    delete user.id
    const updatedUser = await db.models.User.findOneAndUpdate(
      {
        username: user.username,
      },
      {
        ...user,
      },
      { upsert: true, new: true },
    )
    const userResources = resources.filter(
      resource => resource.author === user.username,
    )
    if (userResources.length) {
      await db.models.Resource.insertMany([
        ...userResources.map(ur => ({ ...ur, author: updatedUser._id })),
      ])
    }
    const userCompany = companies.filter(
      company => company.owner === user.username,
    )
    if (userCompany.length) {
      await db.models.Company.insertMany([
        ...userCompany.map(ur => ({ ...ur, owner: updatedUser._id })),
      ])
    }
    return [...(await arr), updatedUser]
  }, [])

  let transformedMessages = []
  await users.forEach(async function buildMessages(user) {
    const userMessages = messages.filter(message =>
      [message.sender, message.receiver].includes(user.username),
    )
    if (userMessages.length) {
      transformedMessages = [
        ...transformedMessages,
        ...userMessages.reduce((arr, message) => {
          const sender =
            message.sender === user.username
              ? user._id
              : users.find(u => u.username === message.sender)?._id
          const receiver =
            message.receiver === user.username
              ? user._id
              : users.find(u => u.username === message.receiver)?._id

          if (
            arr.find(item => item.name === message.name) ||
            transformedMessages.find(item => item.name === message.name)
          )
            return arr
          return [...arr, { ...message, sender, receiver }]
        }, []),
      ]
    }
  })

  await db.models.Message.insertMany([...transformedMessages])

  const transformedCourses = courses.reduce((arr, course) => {
    const students = users
      .filter(user => course.students.includes(user.username))
      .map(us => us._id)
    return [
      ...arr,
      {
        ...course,
        students,
      },
    ]
  }, [])

  await db.models.Course.insertMany([...transformedCourses])
  await db.models.Partner.insertMany(partners.map(p => ({ name: p.name })))
  await users.reduce(async (arr, dbUser) => {
    const partner = partners.find(ptr => ptr.partner === dbUser.username)
    if (partner) {
      await db.models.Partner.update(
        { name: partner.name },
        { $set: { partner: dbUser._id } },
      )
    }
    return arr
  }, [])

  const husbandsId = await ['strong', 'soft', 'weak', 'dirty'].reduce(
    async (obj, type) => {
      await db.models[`Husband_${type}`].insertMany(marriage.husbands)
      const husbands = await db.models[`Husband_${type}`].find({})
      return { ...(await obj), [type]: husbands.map(h => h._id) }
    },
    {},
  )
  await ['strong', 'soft', 'weak', 'dirty'].reduce(async (array, type) => {
    await db.models[`Wife_${type}`].insertMany(marriage.wifes)
    const wifes = await db.models[`Wife_${type}`].find({})
    await wifes.reduce(async (arr, wife, index) => {
      await db.models[`Wife_${type}`].updateOne(
        { _id: wife._id },
        { $set: { husband: husbandsId[type][index] } },
      )
      return arr
    }, [])
    return array
  }, [])

  const groups = await db.models.Family.insertMany(families.groups)
  await families.members.reduce(async (arr, member) => {
    const familiez = groups.filter(family =>
      family.name.split(' ').find(name => member.name.includes(name)),
    )
    await db.models.Member.create({
      name: member.name,
      ...(groups.length && {
        families: familiez.map(f => f._id),
      }),
    })
    return arr
  }, [])
}
