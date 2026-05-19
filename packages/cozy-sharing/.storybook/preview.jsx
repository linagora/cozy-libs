import React from "react";

import 'cozy-ui/dist/cozy-ui.utils.min.css'
import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui-plus/dist/stylesheet.css'
import '../dist/stylesheet.css'

import I18n from "twake-i18n"
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import AlertProvider from 'cozy-ui/transpiled/react/providers/Alert'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import { CozyProvider, createFakeClient } from 'cozy-client'

import enLocale from '../locales/en.json'
import SharingContext from "../src/context";

const preview = {
  decorators: [
    (Story) => {
      const fakeClient = createFakeClient({
        queries: {
          'io.cozy.settings/instance': {
            doctype: 'io.cozy.settings',
            definition: {
              doctype: 'io.cozy.settings',
              id: 'io.cozy.settings/io.cozy.settings.instance'
            },
            data: [
              {
                id: 'io.cozy.settings/io.cozy.settings.instance',
                attributes: {
                  public_name: 'Alice'
                }
              }
            ]
          }
        },
        clientOptions: {
          uri: 'http://alice.cozy.localhost:8080'
        }
      })
      return (
      <CozyProvider client={fakeClient}>
        <CozyTheme ignoreCozySettings>
          <BreakpointsProvider>
            <SharingContext.Provider value={{
              revokeGroup: () => {},
              revokeSelf: () => {},
              getDocumentPermissions: () => [],
              getSharingLink: () => ''
            }}>
              <I18n lang="en" dictRequire={() => enLocale}>
                <AlertProvider>
                  <div style={{position: "relative"}}>
                    <Story />
                  </div>
                </AlertProvider>
              </I18n>
            </SharingContext.Provider>
          </BreakpointsProvider>
        </CozyTheme>
      </CozyProvider>
    )},
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
