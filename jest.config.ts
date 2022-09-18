import type { InitialOptionsTsJest } from 'ts-jest'

const jestConfig: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
}

export default jestConfig

