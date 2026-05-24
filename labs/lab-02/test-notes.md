# React Notes

React is a JavaScript library for building user interfaces.

Components are reusable pieces of user interface. They help developers split a large page into smaller parts.

Props are data passed from a parent component to a child component. Props are read-only and should not be changed by the child component.

State is data that belongs to a component and can change over time. When state changes, React updates the user interface.

React.memo is a higher order component that memoizes your component. It will only re-render if the props have changed.

useMemo is a React Hook that memoizes calculated values so expensive calculations do not run again unnecessarily.

useEffect is a React Hook used to run side effects after a component renders. Examples of side effects include fetching data, updating the document title, or setting up subscriptions.

Conditional rendering means showing different user interface elements depending on a condition.

Lists in React are rendered using the map function. Each list item should have a unique key so React can track items efficiently.