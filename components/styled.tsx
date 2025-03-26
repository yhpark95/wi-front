import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0 0 0 1rem;
`;

export const Header = styled.header`
  border-bottom: 1px solid var(--border);
  padding: 1rem;
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const Main = styled.main`
  padding: 1rem;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 1rem;
`;

export const FiltersColumn = styled.div`
  grid-column: 1;
  grid-row: span 2;
`;

export const ChartColumn = styled.div`
  grid-column: 2;
  grid-row: 1;
`;

export const ChartColumn2 = styled.div`
  grid-column: 3;
  grid-row: 1;
`;

export const CardColumn = styled.div`
  grid-column: 2;
  grid-row: 2;
`;

export const CardColumn2 = styled.div`
  grid-column: 3;
  grid-row: 2;
`; 