import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
  RefObject,
} from "react";
import styled, { css } from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { Classes, Position } from "@blueprintjs/core";
import { noop } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import useClick from "utils/hooks/useClick";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import TooltipComponent from "components/ads/Tooltip";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import Boxed from "pages/Editor/GuidedTour/Boxed";
import { GUIDED_TOUR_STEPS } from "pages/Editor/GuidedTour/constants";

export enum EntityClassNames {
  CONTEXT_MENU = "entity-context-menu",
  RIGHT_ICON = "entity-right-icon",
  PRE_RIGHT_ICON = "entity-pre-right-icon",
  ADD_BUTTON = "t--entity-add-btn",
  NAME = "t--entity-name",
  COLLAPSE_TOGGLE = "t--entity-collapse-toggle",
  WRAPPER = "t--entity",
  PROPERTY = "t--entity-property",
  PAGE = "page",
  TOOLTIP = "t--entity-tooltp",
}

const ContextMenuWrapper = styled.div`
  height: 100%;
`;

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${(props) => props.theme.lineHeights[2]}px;

  &.${EntityClassNames.PAGE} {
    margin: 12px 0;
    border-radius: ${(props) => props.theme.borderRadius};
    border: ${(props) =>
      props.active
        ? `2px solid ${props.theme.colors.primary}`
        : `1px solid ${props.theme.colors.primary}`};
    box-shadow: ${(props) =>
      props.active
        ? `0 0 0 4px ${props.theme.colors.primary}22
      `
        : `
      0 1px 3px 0 rgb(0 0 0 / 10%),
      0 1px 2px 0 rgb(0 0 0 / 6%)
    `};
  }
  ${ContextMenuWrapper} {
    width: 0;
  }
  &: hover {
    & > div > ${ContextMenuWrapper} {
      min-width: 30px;
      width: auto;
    }
  }
`;

export const entityTooltipCSS = css`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const EntityItem = styled.div<{
  active: boolean;
  step: number;
  spaced: boolean;
  highlight: boolean;
  isSticky: boolean;
  rightIconClickable?: boolean;
  alwaysShowRightIcon?: boolean;
}>`
  position: ${({ isSticky }) => (isSticky ? "sticky" : "relative")};
  ${(props) =>
    props.isSticky &&
    css`
      top: 0;
      z-index: 100;
    `}
  font-size: 14px;
  user-select: none;
  padding-left: ${(props) => `calc(0.25rem + (0.25 * ${props.step}rem))`};
  border-top: ${(props) =>
    props.highlight ? `1px solid ${Colors.MINT_GREEN}` : "none"};
  border-bottom: ${(props) =>
    props.highlight ? `1px solid ${Colors.MINT_GREEN}` : "none"};
  background: ${(props) =>
    props.active
      ? Colors.MINT_GREEN_LIGHT
      : props.isSticky
      ? Colors.WHITE
      : "none"};
  height: 36px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: 20px auto 1fr auto auto auto;
  grid-auto-flow: column dense;
  border-radius: 0;
  color: ${(props) =>
    props.active ? Colors.MINT_BLACK : props.theme.colors.text.normal};
  cursor: pointer;
  align-items: center;
  &:hover {
    background: ${Colors.MINT_GREEN_LIGHT}66;
  }

  scroll-margin-top: 36px;
  scroll-snap-margin-top: 36px;

  & .${EntityClassNames.TOOLTIP} {
    ${entityTooltipCSS}
    .${Classes.POPOVER_TARGET} {
      ${entityTooltipCSS}
    }
  }

  .file-ops {
    height: 36px;
  }

  & .${EntityClassNames.COLLAPSE_TOGGLE} {
    svg {
      path {
        fill: ${Colors.GRAY};
      }
    }
  }

  &&&& .${EntityClassNames.CONTEXT_MENU} {
    display: block;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
  }
  &&&&:hover .${EntityClassNames.CONTEXT_MENU} {
    visibility: visible;
  }

  & .${EntityClassNames.RIGHT_ICON} {
    visibility: ${(props) =>
      props.alwaysShowRightIcon ? "visible" : "hidden"};
    height: 100%;
    width: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  & .${EntityClassNames.RIGHT_ICON}:hover {
    background: ${(props) =>
      props.rightIconClickable ? Colors.SHARK2 : "initial"};
    svg {
      path {
        fill: ${(props) =>
          props.rightIconClickable ? Colors.WHITE : "initial"};
      }
    }
  }

  & .${EntityClassNames.RIGHT_ICON} svg {
    cursor: ${(props) => (props.rightIconClickable ? "pointer" : "initial")};
  }

  &:hover .${EntityClassNames.RIGHT_ICON} {
    visibility: visible;
  }
`;

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
  color: ${Colors.CHARCOAL};
  display: flex;
  align-items: center;

  div {
    cursor: pointer;
  }

  svg {
    width: 16px;
    height: 16px;
  }
  margin-right: 4px;
`;

export type EntityProps = {
  entityId: string;
  className?: string;
  name: string;
  children?: ReactNode;
  highlight?: boolean;
  icon: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  action?: (e: any) => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  onCreate?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: (isOpen: boolean) => void;
  alwaysShowRightIcon?: boolean;
  onClickRightIcon?: () => void;
  addButtonHelptext?: JSX.Element | string;
  isBeta?: boolean;
  preRightIcon?: ReactNode;
  onClickPreRightIcon?: () => void;
  isSticky?: boolean;
  collapseRef?: RefObject<HTMLDivElement> | null;
  customAddButton?: ReactNode;
};

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const [isOpen, open] = useState(!!props.isDefaultExpanded);
    const isUpdating = useEntityUpdateState(props.entityId);
    const isEditing = useEntityEditState(props.entityId);
    const dispatch = useDispatch();
    const guidedTourEnabled = useSelector(inGuidedTour);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (props.isDefaultExpanded || props.searchKeyword) {
        open(true);
        props.onToggle && props.onToggle(true);
      }
    }, [props.isDefaultExpanded, props.searchKeyword]);
    useEffect(() => {
      if (!props.searchKeyword && !props.isDefaultExpanded) {
        open(false);
      }
    }, [props.searchKeyword]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const toggleChildren = (e: any) => {
      // Make sure this entity is enabled before toggling the collpse of children.
      !props.disabled && open(!isOpen);
      if (props.runActionOnExpand && !isOpen) {
        props.action && props.action(e);
      }

      if (props.onToggle) {
        props.onToggle(!isOpen);
      }
    };

    const updateNameCallback = useCallback(
      (name: string) => {
        return (
          props.updateEntityName && props.updateEntityName(props.entityId, name)
        );
      },
      [props.entityId, props.updateEntityName],
    );

    const handleClick = (e: any) => {
      if (props.action) props.action(e);
      else toggleChildren(e);
    };

    const exitEditMode = useCallback(() => {
      dispatch({
        type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
      });
    }, [dispatch]);

    const enterEditMode = useCallback(() => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }
      props.updateEntityName &&
        dispatch({
          type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
          payload: {
            id: props.entityId,
          },
        });
    }, [dispatch, props.entityId, props.updateEntityName, guidedTourEnabled]);

    const itemRef = useRef<HTMLDivElement | null>(null);
    useClick(itemRef, handleClick, noop);

    const addButton = props.customAddButton || (
      <TooltipComponent
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={props.addButtonHelptext || ""}
        disabled={!props.addButtonHelptext}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <AddButton
          className={`${EntityClassNames.ADD_BUTTON} ${props.className}`}
          onClick={props.onCreate}
        />
      </TooltipComponent>
    );

    return (
      <Boxed
        show={props.name === "updateCustomerInfo"}
        step={GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS}
      >
        <Wrapper
          active={!!props.active}
          className={`${EntityClassNames.WRAPPER} ${props.className}`}
          ref={ref}
        >
          <EntityItem
            active={!!props.active}
            alwaysShowRightIcon={props.alwaysShowRightIcon}
            className={`${props.highlight ? "highlighted" : ""} ${
              props.active ? "active" : ""
            } t--entity-item`}
            data-guided-tour-id={`explorer-entity-${props.name}`}
            data-guided-tour-iid={props.name}
            highlight={!!props.highlight}
            id={"entity-" + props.entityId}
            isSticky={props.isSticky === true}
            rightIconClickable={typeof props.onClickRightIcon === "function"}
            spaced={!!props.children}
            step={props.step}
          >
            <CollapseToggle
              className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
              disabled={!!props.disabled}
              isOpen={isOpen}
              isVisible={!!props.children}
              onClick={toggleChildren}
            />
            <IconWrapper onClick={handleClick}>{props.icon}</IconWrapper>
            <EntityName
              className={`${EntityClassNames.NAME}`}
              enterEditMode={enterEditMode}
              entityId={props.entityId}
              exitEditMode={exitEditMode}
              isBeta={props.isBeta}
              isEditing={!!props.updateEntityName && isEditing}
              name={props.name}
              nameTransformFn={props.onNameEdit}
              ref={itemRef}
              searchKeyword={props.searchKeyword}
              updateEntityName={updateNameCallback}
            />
            {props.preRightIcon && (
              <IconWrapper
                className={`${EntityClassNames.PRE_RIGHT_ICON} w-full h-full`}
                onClick={props.onClickPreRightIcon}
              >
                {props.preRightIcon}
              </IconWrapper>
            )}
            {props.rightIcon && (
              <IconWrapper
                className={EntityClassNames.RIGHT_ICON}
                onClick={props.onClickRightIcon}
              >
                {props.rightIcon}
              </IconWrapper>
            )}
            {addButton}
            {props.contextMenu && (
              <ContextMenuWrapper>{props.contextMenu}</ContextMenuWrapper>
            )}
            <Loader isVisible={isUpdating} />
          </EntityItem>
          <Collapse
            active={props.active}
            collapseRef={props.collapseRef}
            isOpen={isOpen}
            step={props.step}
          >
            {props.children}
          </Collapse>
        </Wrapper>
      </Boxed>
    );
  },
);

Entity.displayName = "Entity";

export default Entity;
