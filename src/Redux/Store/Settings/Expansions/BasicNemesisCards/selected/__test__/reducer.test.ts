import { Cmd, getCmd, getModel } from 'redux-loop'
import { set as setToDb, get as getFromDb } from 'idb-keyval'

import { State } from '../types'
import { BASIC_NEMESIS_CARDS_DB_KEY } from '../constants'
import { actions } from '../actions'

import { initialState, Reducer } from '../reducer'

const mockSelectedBasicNemesisCardsState: State = initialState

describe('Settings | Expansions | BasicNemesisCards | selected | reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    const result = Reducer(undefined, {})

    expect(result).toEqual(initialState)
  })

  it('should handle TOGGLE', () => {
    const selectedBasicNemesisCardsToSave = initialState.filter(
      treasure => treasure !== 'BaneSire-AE'
    )

    const result = Reducer(
      mockSelectedBasicNemesisCardsState,
      actions.toggleCard('BaneSire-AE')
    )

    const model = getModel(result)
    const cmd = getCmd(result)

    expect(model).toMatchSnapshot()
    expect(cmd).toEqual(
      Cmd.run(setToDb, {
        args: [BASIC_NEMESIS_CARDS_DB_KEY, selectedBasicNemesisCardsToSave],
        successActionCreator: actions.setToDBSuccessful,
        failActionCreator: actions.setToDBFailed,
      })
    )
  })

  it('should handle FETCH_FROM_DB', () => {
    const result = Reducer(initialState, actions.fetchFromDB())

    const model = getModel(result)
    const cmd = getCmd(result)

    expect(model).toEqual(initialState)

    expect(cmd).toEqual(
      Cmd.run(getFromDb, {
        args: [BASIC_NEMESIS_CARDS_DB_KEY],
        successActionCreator: actions.fetchFromDBSuccessful,
        failActionCreator: actions.fetchFromDBFailed,
      })
    )
  })

  it('should handle FETCH_FROM_DB_SUCCESS for defined state', () => {
    const result = Reducer(
      mockSelectedBasicNemesisCardsState,
      actions.fetchFromDBSuccessful(['BaneSire-AE'])
    )

    expect(getModel(result)).toEqual(['BaneSire-AE'])
  })

  it('should handle FETCH_FROM_DB_SUCCESS for undefined state', () => {
    const result = Reducer(
      initialState,
      // @ts-ignore
      actions.fetchFromDBSuccessful(undefined)
    )

    expect(getModel(result)).toEqual(initialState)
  })

  it.todo('should handle FETCH_FROM_DB_FAILURE')
  it.todo('should handle SET_TO_DB')
  it.todo('should handle SET_TO_DB_SUCCESS')
  it.todo('should handle SET_TO_DB_FAILURE')
})
