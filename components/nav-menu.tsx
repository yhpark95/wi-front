'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const Nav = styled.nav`
  margin-left: 1rem;
`;

const NavList = styled.ul`
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  position: relative;
`;

const NavButton = styled.button`
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #1f2937;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: #2563eb;
  }
`;

const Dropdown = styled.div<{ isopen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  opacity: ${({ isopen }) => (isopen ? 1 : 0)};
  visibility: ${({ isopen }) => (isopen ? 'visible' : 'hidden')};
  transform: translateY(${({ isopen }) => (isopen ? '0' : '-10px')});
  transition: all 0.2s ease-out;
  z-index: 50;
`;

const DropdownList = styled.ul`
  padding: 1rem;
  margin: 0;
  list-style: none;
`;

const DropdownItem = styled.li`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DropdownLink = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #1f2937;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const DropdownTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const DropdownDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const ChevronIcon = styled.span<{ isopen: boolean }>`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  transform: ${({ isopen }) => (isopen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
`;

export function NavMenu() {
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  const handleMouseEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  return (
    <Nav>
      <NavList>
        <NavItem onMouseEnter={() => handleMouseEnter('overview')} onMouseLeave={handleMouseLeave}>
          <NavButton>
            Overview
            <ChevronIcon isopen={openMenu === 'overview'} />
          </NavButton>
          <Dropdown isopen={openMenu === 'overview'}>
            <DropdownList>
              <DropdownItem>
                <DropdownLink href="#">
                  <DropdownTitle>Customer Analysis</DropdownTitle>
                  <DropdownDescription>
                    Analyze customer behavior and trends through interactive charts
                  </DropdownDescription>
                </DropdownLink>
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </NavItem>

        <NavItem onMouseEnter={() => handleMouseEnter('reports')} onMouseLeave={handleMouseLeave}>
          <NavButton>
            Reports
            <ChevronIcon isopen={openMenu === 'reports'} />
          </NavButton>
          <Dropdown isopen={openMenu === 'reports'}>
            <DropdownList>
              <DropdownItem>
                <DropdownLink href="#">
                  <DropdownTitle>Price Analysis</DropdownTitle>
                  <DropdownDescription>
                    Detailed price trends and comparisons
                  </DropdownDescription>
                </DropdownLink>
              </DropdownItem>
              <DropdownItem>
                <DropdownLink href="#">
                  <DropdownTitle>Quantity Analysis</DropdownTitle>
                  <DropdownDescription>
                    Volume and quantity distribution reports
                  </DropdownDescription>
                </DropdownLink>
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </NavItem>

        <NavItem onMouseEnter={() => handleMouseEnter('data')} onMouseLeave={handleMouseLeave}>
          <NavButton>
            Data
            <ChevronIcon isopen={openMenu === 'data'} />
          </NavButton>
          <Dropdown isopen={openMenu === 'data'}>
            <DropdownList>
              <DropdownItem>
                <DropdownLink href="/data-management">
                  <DropdownTitle>Data Management</DropdownTitle>
                  <DropdownDescription>
                    Upload new data or download existing data in various formats
                  </DropdownDescription>
                </DropdownLink>
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </NavItem>
      </NavList>
    </Nav>
  );
}
