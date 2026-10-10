import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { BuildingBlocks } from './learn/BuildingBlocks'
import { Cheatsheet } from './learn/Cheatsheet'
import { Foldables } from './learn/Foldables'
import { Intro } from './learn/Intro'
import { LearnLayout } from './learn/LearnLayout'
import { LifecycleDiagrams } from './learn/LifecycleDiagrams'
import { Toolchain } from './learn/Toolchain'
import { Widgets } from './learn/Widgets'
import { Playground } from './playground/Playground'

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <Playground /> },
        {
          path: 'learn',
          element: <LearnLayout />,
          children: [
            { index: true, element: <Intro /> },
            { path: 'lifecycle', element: <LifecycleDiagrams /> },
            { path: 'building-blocks', element: <BuildingBlocks /> },
            { path: 'toolchain', element: <Toolchain /> },
            { path: 'widgets', element: <Widgets /> },
            { path: 'foldables', element: <Foldables /> },
            { path: 'cheatsheet', element: <Cheatsheet /> },
          ],
        },
        { path: '*', element: <Playground /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') },
)

export function App() {
  return <RouterProvider router={router} />
}
